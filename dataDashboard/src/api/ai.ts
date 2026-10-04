export type AiScene = 'drawer' | 'interpret' | 'skill' | 'jd'

export interface StreamAIOptions {
  scene: AiScene
  // 待分析正文内容
  input: string
  // 附加信息：岗位详情等
  context?: string
  signal?: AbortSignal
  // 每收到一次文本增量，调用该回调
  onDelta: (delta: string) => void
}

/**
 * 流式调用AI分析接口
 */
export async function streamAI({
  scene,
  input,
  context,
  signal,
  onDelta,
} : StreamAIOptions): Promise<void> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      scene,
      input,
      context,
    }),
  })

  if(!response.ok || !response.body) {
    const detail = (await response.json().catch(() => null))
    throw new Error(detail?.message || detail?.error || 'AI 分析失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while(true) {
    const { done, value } = await reader.read()
    if(done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for(const line of lines) {
      if(!line.startsWith('data:')) {
        continue
      }
      // {"choices":[{"delta":{"content":"你"}}]} -> payload(把最前面的的 data: 去掉了)
      const payload = line.slice(5).trim()
      if(payload === '[DONE]') {
        return
      }

      let event: { content?: string; error?: string }
      try {
        event = JSON.parse(payload)
      } catch  {
        continue
      }
      if(event.error) {
        throw new Error(event.error)
      }
      if(event.content) {
        onDelta(event.content)
      }
    }
  }
}
