import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  buildMessages,
  createChatStream,
  normalizeMessages,
  resolveScene,
} from '../services/ai.service'
import type { ClientMessage } from '../services/ai.service'
import {
  appendAssistantMessage,
  appendHistory,
  deleteConversations,
  getConversation,
  listConversations,
  saveConversation,
} from '../services/conversation.service'
import { getClientIp } from './ip'
import { requireAuth } from '../middleware/auth'
import { getPreference } from '../services/user.service'
import {
  formatJobPrompt,
  formatPreferencePrompt,
  getMatchJob,
  getMatchReport,
} from '../services/match.service'

export const aiRouter = Router()

/** 从上游 SSE 数据行中取出文本增量，非 JSON 行（如心跳）直接忽略 */
function extractDelta(payload: string): string {
  try {
    // 将AI得到的JSON字符串解析为对象，并告诉TypeScript对象的结构
    const parsed = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
    return parsed.choices?.[0]?.delta?.content ?? ''
  } catch {
    return ''
  }
}

/** 生成会话 ID：c- + 时间戳（36 进制）+ 随机短串 */
function createConversationId(): string {
  return `c-${Date.now().toString(36)}${randomUUID().slice(0, 8)}`
}

/** 客户端可自带会话 ID，只接受字母、数字、下划线、短横线，长度不超过 64 */
function normalizeConversationId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return /^[A-Za-z0-9_-]{1,64}$/.test(text) ? text : null
}

// 一次批量删除最多 50 个，避免超长 SQL
const MAX_BATCH_DELETE = 50

/**
 * 把数组 / 逗号分隔字符串 / 重复 query 参数归一成去重后的 ID 列表。
 * 只要有一个不合法就整体返回 null，避免带脏数据进 SQL。
 */
function collectConversationIds(value: unknown): string[] | null {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : null
  if (!list) return null

  const ids = new Set<string>()
  for (const item of list) {
    const id = normalizeConversationId(item)
    if (!id) return null
    ids.add(id)
  }

  if (ids.size === 0 || ids.size > MAX_BATCH_DELETE) return null
  return [...ids]
}

/**
 * 历史会话列表：返回当前登录用户最近的会话，按最后活跃时间倒序。
 * GET /api/ai/conversations?limit=20
 */
aiRouter.get('/conversations', requireAuth, async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const list = await listConversations(req.userId!, limit)

  res.json({
    code: 0,
    message: 'success',
    data: list,
  })
})

/**
 * 单个会话的全部消息，按 seq 顺序返回。
 * 只允许读取当前用户自己的会话，避免拿到 ID 就能翻别人的对话。
 * GET /api/ai/conversation?conversationId=c-xxx
 */
aiRouter.get('/conversation', requireAuth, async (req, res) => {
  const rawId = req.query.conversationId
  const idText = Array.isArray(rawId) ? rawId[0] : rawId
  const conversationId = normalizeConversationId(idText)

  if (!conversationId) {
    return res.status(400).json({
      code: 1,
      message: 'conversationId 参数错误',
    })
  }

  const detail = await getConversation(conversationId, req.userId!)
  if (!detail) {
    return res.status(404).json({
      code: 1,
      message: '会话不存在',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: detail,
  })
})

/**
 * 批量删除会话及其全部消息，单个删除也走这个接口。
 * ID 可从 body.conversationIds（数组）传入，也可用 query.conversationId 重复传或逗号分隔。
 * 只允许删除当前用户自己的会话，不属于自己的一律计入 missing。
 * DELETE /api/ai/conversation
 *   { "conversationIds": ["c-1", "c-2"] }
 */
aiRouter.delete('/conversation', requireAuth, async (req, res) => {
  const ids = collectConversationIds(req.body?.conversationIds)
    ?? collectConversationIds(req.query.conversationId)

  if (!ids) {
    return res.status(400).json({
      code: 1,
      message: `conversationIds 参数错误（1-${MAX_BATCH_DELETE} 个合法 ID）`,
    })
  }

  const result = await deleteConversations(ids, req.userId!)
  if (result.deleted === 0) {
    return res.status(404).json({
      code: 1,
      message: '会话不存在',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: result,
  })
})

/**
 * 岗位匹配度分析：服务端自动取岗位信息 + 当前用户的求职意向，交给 AI 打分。
 * POST /api/ai/match
 * { "jobId": 24014, "force": false }
 * force 为 true 时忽略缓存重新生成；
 * 只做分析不落库，用户点「保存报告」后由 POST /api/user/match-report 写入。
 * SSE 首帧 { cached }，随后 data: {"content":"..."}，结束 data: [DONE]。
 */
aiRouter.post('/match', requireAuth, async (req, res, next) => {
  const jobId = Number(req.body?.jobId)
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ code: 1, message: 'jobId 参数错误' })
  }

  const force = req.body?.force === true

  const job = await getMatchJob(jobId)
  if (!job) {
    return res.status(404).json({ code: 1, message: '岗位不存在' })
  }

  const preference = await getPreference(req.userId!)
  if (!preference) {
    return res.status(400).json({ code: 1, message: '请先填写求职意向' })
  }

  // 客户端断开时终止上游请求
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) controller.abort()
  })

  const startEventStream = () => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()
  }

  // 命中缓存：把上次结果一次性下发，格式与流式一致，前端不用分两种情况
  const cached = force ? null : await getMatchReport(req.userId!, jobId)
  if (cached) {
    startEventStream()
    res.write(`data: ${JSON.stringify({ cached: true, score: cached.score })}\n\n`)
    res.write(`data: ${JSON.stringify({ content: cached.content })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
    return
  }

  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await createChatStream(
      buildMessages('match', [{ role: 'user', content: formatJobPrompt(job) }], formatPreferencePrompt(preference)),
      controller.signal,
    )
  } catch (error) {
    next(error)
    return
  }

  startEventStream()
  res.write(`data: ${JSON.stringify({ cached: false })}\n\n`)

  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // 结束本轮：不落库，保存动作由前端点击「保存报告」触发
  const finish = () => {
    res.write('data: [DONE]\n\n')
    res.end()
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue

        const payload = line.slice(5).trim()
        if (!payload) continue

        if (payload === '[DONE]') {
          finish()
          return
        }

        const delta = extractDelta(payload)
        if (delta) {
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
        }
      }
    }

    finish()
  } catch (error) {
    console.error('[match] 流读取失败:', error)
    if (controller.signal.aborted) return

    if (!res.writableEnded) {
      const message = error instanceof Error ? error.message : '匹配分析中断'
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
      res.end()
    }
  }
})

/**
 * AI 流式分析：以 SSE 逐段下发文本增量。
 * 请求体支持两种写法：
 * - 多轮：{ scene, messages: [{ role, content }, ...], conversationId? }
 * - 单轮：{ scene, input, context?, conversationId? }
 * 事件格式：首帧下发 data: {"conversationId":"..."}，随后是 data: {"content":"..."}，
 * 正常结束补一个 data: [DONE]，流中途出错下发 data: {"error":"..."}
 * （此时响应头已发出，无法再走统一错误中间件）。
 */
aiRouter.post('/chat', requireAuth, async (req, res, next) => {
  const {
    scene: rawScene,
    messages: rawMessages,
    input,
    context,
    conversationId: rawConversationId,
  } = req.body ?? {}

  const scene = resolveScene(rawScene)
  if (!scene) {
    return res.status(400).json({ error: '场景参数错误' })
  }

  // 多轮优先：传了 messages 就必须合法，不再回退到 input
  let messages: ClientMessage[] | null
  if (rawMessages !== undefined) {
    messages = normalizeMessages(rawMessages)
    if (!messages) {
      return res.status(400).json({ error: 'messages 参数错误' })
    }
  } else {
    const text = typeof input === 'string' ? input.trim() : ''
    messages = text ? [{ role: 'user', content: text }] : null
    if (!messages) {
      return res.status(400).json({ error: '输入参数错误' })
    }
  }

  const conversationId = normalizeConversationId(rawConversationId) ?? createConversationId()

  // 客户端断开（关闭抽屉、切换标签页）时终止请求，避免继续消耗token
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded) controller.abort()
  })

  // 先落库用户提问：即使上游失败，也能留下这次对话记录。
  // 落库失败不影响本次回答，此时 conversationPk 为 null，结束时不补存回答。
  let conversationPk: number | null = null
  try {
    conversationPk = await saveConversation(conversationId, req.userId!, scene, getClientIp(req))
    await appendHistory(conversationPk, messages)
  } catch (error) {
    console.error('[chat] 会话落库失败:', error)
  }

  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await createChatStream(
      buildMessages(scene, messages, typeof context === 'string' ? context : undefined),
      controller.signal,
    )
  } catch (error) {
    next(error)
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // 不缓冲，收到就发送
  res.flushHeaders() // 立即发送响应头

  // 首帧回传会话 ID，前端新建会话时据此保存下来供下一轮使用
  res.write(`data: ${JSON.stringify({ conversationId })}\n\n`)

  // 从上游流中读取数据，逐行处理
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''

  // 结束本轮：补存模型回复后下发结束标记
  const finish = async () => {
    if (conversationPk !== null) {
      try {
        await appendAssistantMessage(conversationPk, answer)
      } catch (error) {
        console.error('[chat] AI 回复落库失败:', error)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue

        const payload = line.slice(5).trim()
        if (!payload) continue

        if (payload === '[DONE]') {
          await finish()
          return
        }

        const delta = extractDelta(payload)
        if (delta) {
          answer += delta
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
        }
      }
    }

    await finish()
  } catch (error) {
    console.error('[chat] 流读取失败:', error)
    if (controller.signal.aborted) return

    if (!res.writableEnded) {
      const message = error instanceof Error ? error.message : 'AI 分析中断'
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
      res.end()
    }
  }
})
