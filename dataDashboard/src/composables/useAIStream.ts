import { computed, ref } from 'vue'
import { streamAI } from '@/api/ai'
import type { AiScene } from '@/api/ai'
import { parseSections, sectionText } from '@/utils/aiText'
import type { AISection } from '@/utils/aiText'

/** 拒绝小节的标题，与后端 prompt 里约定的保持一致 */
const REFUSE_TITLE = '无法分析'

export interface AIStreamOptions {
  scene: AiScene
  input: string
  context?: string
}

/**
 * AI 流式分析的公共状态：增量文本、结构化小节、加载与错误。
 * 三个入口（分析页 / 洞察抽屉 / 智能解读浮层）共用，避免各处重复实现 SSE 与中止逻辑。
 */
export function useAIStream() {
  /** AI 原始输出，随流式增量累加 */
  const raw = ref('')
  const loading = ref(false)
  const error = ref('')

  let controller: AbortController | null = null

  const sections = computed<AISection[]>(() => parseSections(raw.value))

  // 小节标题是流式到达的（## 无 → ## 无法 → ## 无法分析），
  // 还没输完时不能下结论，否则会先闪一下结果区再切成拒绝提示
  const isRefuseTitle = (title: string) => title.includes('无法') || REFUSE_TITLE.startsWith(title)

  /** 结果就绪：出现了「非拒绝」的小节 */
  const hasResult = computed(() => sections.value.some((section) => !isRefuseTitle(section.title)))

  /** 发起一次流式分析；重复调用会先中止上一次请求 */
  const start = async ({ scene, input, context }: AIStreamOptions) => {
    const text = input.trim()
    if (!text || loading.value) return

    const self = new AbortController()
    controller?.abort()
    controller = self

    raw.value = ''
    error.value = ''
    loading.value = true

    try {
      await streamAI({
        scene,
        input: text,
        context,
        signal: self.signal,
        onDelta: (delta) => {
          raw.value += delta
        },
      })
    } catch (err) {
      // 主动中止（关闭面板、切换标签页）不算失败
      if (!self.signal.aborted) {
        error.value = err instanceof Error ? err.message : 'AI 分析失败，请稍后重试'
      }
    } finally {
      // 已被更晚的请求接管时不要覆盖其状态
      if (controller === self) {
        controller = null
        loading.value = false
      }
    }
  }

  // 拒绝请求：同样用 isRefuseTitle 判断，避免标题输到一半时判定不一致
  const refuseReason = computed(() => sectionText(sections.value, REFUSE_TITLE) || '该内容无法分析')
  const refused = computed(() => sections.value.some((section) => isRefuseTitle(section.title)))

  /** 中止进行中的请求，保留已有结果 */
  const stop = () => {
    controller?.abort()
    controller = null
    loading.value = false
  }

  /** 中止请求并清空结果 */
  const reset = () => {
    stop()
    raw.value = ''
    error.value = ''
  }

  return { raw, sections, hasResult, loading, error, start, stop, reset, refuseReason, refused }
}
