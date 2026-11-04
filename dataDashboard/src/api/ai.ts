import { getToken } from '@/utils/token'

export type AiScene = 'drawer' | 'interpret' | 'skill' | 'jd' | 'chat'

/** 多轮对话消息：role 只允许 user / assistant，system 由服务端拼装 */
export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamAIOptions {
  scene: AiScene
  // 待分析正文内容（单轮场景使用）
  input?: string
  // 多轮对话消息（scene=chat 使用，与 input 二选一）
  messages?: AiMessage[]
  // 附加信息：岗位详情等
  context?: string
  // 继续已有的会话时传入；不传则由后端新建并发回
  conversationId?: string
  // 后端在首帧回传会话 ID，用于后续轮次续接同一会话
  onConversationId?: (conversationId: string) => void
  signal?: AbortSignal
  // 每收到一次文本增量，调用该回调
  onDelta: (delta: string) => void
}

/**
 * 流式调用AI分析接口
 * 单轮场景传 input，多轮对话（scene=chat）传完整 messages 历史
 */
export async function streamAI({
  scene,
  input,
  messages,
  context,
  conversationId,
  onConversationId,
  signal,
  onDelta,
}: StreamAIOptions): Promise<void> {
  // 后端 /api/ai/chat 需要登录态，未带 token 会直接 401
  const token = getToken()
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
    body: JSON.stringify({
      scene,
      input,
      messages,
      context,
      conversationId,
    }),
  })

  if (!response.ok || !response.body) {
    const detail = (await response.json().catch(() => null))
    throw new Error(detail?.message || detail?.error || 'AI 分析失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) {
        continue
      }
      // {"choices":[{"delta":{"content":"你"}}]} -> payload(把最前面的的 data: 去掉了)
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') {
        return
      }

      let event: { content?: string; error?: string; conversationId?: string }
      try {
        event = JSON.parse(payload)
      } catch {
        continue
      }
      if (event.error) {
        throw new Error(event.error)
      }
      if (event.conversationId) {
        onConversationId?.(event.conversationId)
      }
      if (event.content) {
        onDelta(event.content)
      }
    }
  }
}
