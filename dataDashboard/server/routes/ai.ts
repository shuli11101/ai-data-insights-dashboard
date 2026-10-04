import { Router } from 'express'
import { buildMessages, createChatStream, isAIScene } from '../services/ai.service'

export const aiRouter = Router()

/** 从上游 SSE 数据行中取出文本增量，非 JSON 行（如心跳）直接忽略 */
function extractDelta(payload: string): string {
  try {
    // 将AI得到的JSON字符串解析为对象，并告诉TypeScript对象的结构
    const parsed = JSON.parse(payload) as { choices ?: { delta ?: { content ?: string } }[] }
    return parsed.choices?.[ 0 ]?.delta?.content ?? ''
  } catch  {
    return ''
  }
}

/**
 * AI 流式分析：以 SSE 逐段下发文本增量。
 * 事件格式：data: {"content":"..."}，正常结束补一个 data: [DONE]，
 * 流中途出错下发 data: {"error":"..."}（此时响应头已发出，无法再走统一错误中间件）。
 */
aiRouter.post('/chat', async (req, res ,next) => {
  const { scene, input, context } = req.body ?? {}
  if(!isAIScene(scene)) {
    return res.status(400).json({ error: '场景参数错误' })
  }

  const text = typeof input === 'string' ? input : ''
  if(!text) {
    return res.status(400).json({ error: '输入参数错误' })
  }

  // 客户端断开（关闭抽屉、切换标签页）时终止请求，避免继续消耗token
  const controller = new AbortController()
  // req.on('close', () => controller.abort())
  res.on('close', () => {
    if(!res.writableEnded) {
      controller.abort()
      return
    }
  })

  let upstream: ReadableStream<Uint8Array>
  try {
    upstream = await createChatStream(
      buildMessages(scene, text, typeof context === 'string' ? context : undefined),
      controller.signal
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

  // 从上游流中读取数据，逐行处理
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for(const line of lines) {
        if(!line.startsWith('data:')) continue

        const payload = line.slice(5).trim()
        if(!payload) continue

        if(payload === '[DONE]') {
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }

        const delta = extractDelta(payload)
        if(delta) {
          res.write(`data: ${ JSON .stringify({ content: delta })} \n\n`)
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('[chat] 流读取失败:', error)
    console.error('aborted =', controller.signal.aborted)
   if(controller.signal.aborted)
    return
  if (!res. writableEnded) {
    const message = error instanceof Error ? error.message : 'AI 分析中断'
    res.write(`data:${ JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
  }
})
