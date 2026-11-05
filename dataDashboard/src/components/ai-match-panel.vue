<!--
  AI 岗位匹配分析面板
  - mode="panel"：绝对定位，盖住所处的卡片（职位搜索页右侧详情卡）
  - mode="page" ：固定定位，盖住整个页面（岗位详情页）
  结果样式与「个人技能评估」报告（analysis-report.vue）保持一致：
  匹配度 / 覆盖率指标 + 两列报告块，内容来自 AI 输出的小节解析
-->
<template>
  <teleport to="body" :disabled="mode === 'panel'">
    <transition name="match-fade">
      <div v-if="visible" class="ai-match" :class="`ai-match--${mode}`">
        <section class="ai-match__card">
          <header class="ai-match__head">
            <div class="ai-match__titles">
              <h3 class="ai-match__title">AI 匹配分析</h3>
              <p class="ai-match__sub">{{ subtitle }}</p>
            </div>
            <el-button text circle class="ai-match__close" :icon="Close" aria-label="关闭" @click="close" />
          </header>

          <div class="ai-match__body">
            <!-- 等待首个小节 -->
            <p v-if="loading && !hasSections" class="ai-match__hint">正在比对求职意向与岗位要求…</p>
            <p v-if="error" class="ai-match__error">{{ error }}</p>

            <template v-if="hasSections">
              <div class="report__metrics">
                <section class="report__score">
                  <span class="report__label">匹配度评分</span>
                  <strong class="report__score-value">{{ matchScore }}%</strong>
                  <p class="report__hint">{{ scoreHint }}</p>
                </section>

                <section class="report__above">
                  <span class="report__label">技能覆盖率</span>
                  <strong class="report__above-value">{{ coverage }}%</strong>
                  <p class="report__hint">岗位要求技能的已覆盖比例</p>
                  <div class="report__bar">
                    <span :style="{ width: `${coverage}%` }"></span>
                  </div>
                </section>
              </div>

              <div class="report__body">
                <div class="report__col">
                  <section class="report-block">
                    <h3 class="report-block__title">技能匹配</h3>
                    <div class="report__facts">
                      <div v-for="fact in techFacts" :key="fact.label" class="report__fact">
                        <span class="report__label">{{ fact.label }}</span>
                        <strong>{{ fact.value }}</strong>
                      </div>
                    </div>
                  </section>

                  <section class="report-block">
                    <h3 class="report-block__title">城市与学历</h3>
                    <div class="report__facts">
                      <div v-for="fact in conditionFacts" :key="fact.label" class="report__fact">
                        <span class="report__label">{{ fact.label }}</span>
                        <strong>{{ fact.value }}</strong>
                      </div>
                    </div>
                  </section>

                  <section class="report-block">
                    <h3 class="report-block__title">薪资匹配</h3>
                    <div class="report__facts">
                      <div v-for="fact in salaryFacts" :key="fact.label" class="report__fact">
                        <span class="report__label">{{ fact.label }}</span>
                        <strong>{{ fact.value }}</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="report__col">
                  <section class="report-block">
                    <h3 class="report-block__title">
                      建议
                      <span class="report-block__count">{{ advice.length }} 条</span>
                    </h3>
                    <ol v-if="advice.length" class="report-list">
                      <li v-for="(text, index) in advice" :key="text" class="report-item">
                        <span class="report-item__index">{{ index + 1 }}</span>
                        <span>{{ text }}</span>
                      </li>
                    </ol>
                    <p v-else class="report__empty">—</p>
                  </section>
                </div>
              </div>
            </template>

            <!-- 模型没按小节输出时兜底显示原文 -->
            <div v-else-if="content" class="ai-match__content">{{ content }}</div>
          </div>

          <footer class="ai-match__foot">
            <el-button class="ai-match__btn" @click="close">关闭</el-button>
            <el-button v-if="loggedIn" class="ai-match__btn" type="primary" :loading="loading" @click="run(true)">
              重新分析
            </el-button>
            <el-button v-else class="ai-match__btn" type="primary" @click="goLogin">去登录</el-button>
          </footer>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'

import { streamMatch } from '@/api/ai'
import { parseSections, sectionItems, sectionNumber } from '@/utils/aiText'
import { getToken } from '@/utils/token'

const props = withDefaults(defineProps<{
  /** 要分析的岗位 ID */
  jobId: number
  /** 岗位名称，用于副标题展示 */
  jobTitle?: string
  /** panel = 盖住父级卡片，page = 盖住整个页面 */
  mode?: 'panel' | 'page'
}>(), {
  jobTitle: '',
  mode: 'panel',
})

/** 面板显隐，由父组件 v-model 控制；打开时自动开始分析 */
const visible = defineModel<boolean>({ default: false })

const router = useRouter()

const content = ref('')
const score = ref<number | null>(null)
const error = ref('')
const loading = ref(false)

const loggedIn = computed(() => Boolean(getToken()))
const subtitle = computed(() =>
  props.jobTitle ? `${props.jobTitle} · 与你的求职意向比对` : '与你的求职意向比对',
)

let controller: AbortController | null = null
/** 防抖：连续点击「重新分析」或快速开关面板时，短时间内只发起一次请求 */
const MATCH_DEBOUNCE = 800
let lastRunAt = 0

// ---------- 结果解析：与「个人技能评估」报告同一套小节结构 ----------
const sections = computed(() => parseSections(content.value))
const hasSections = computed(() => sections.value.length > 0)

/** 把「维度：内容」形式的小节拆成键值对 */
const buildPairs = (title: string) => {
  const map: Record<string, string> = {}
  for (const text of sectionItems(sections.value, title)) {
    const matched = /^(.+?)[：:]\s*(.*)$/.exec(text.trim())
    if (matched) map[matched[1]!.trim()] = matched[2]!.trim()
  }
  return map
}

const pairs = computed(() => ({
  tech: buildPairs('技术栈'),
  city: buildPairs('城市'),
  education: buildPairs('学历'),
  salary: buildPairs('薪资'),
}))

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

/** 优先用服务端缓存的分数，流式结果则从「综合匹配分」小节解析 */
const matchScore = computed(() => {
  const value = score.value ?? sectionNumber(sections.value, '综合匹配分')
  return clampPercent(value)
})

const coverage = computed(() => {
  const matched = /\d+/.exec(pairs.value.tech['技能覆盖率'] ?? '')
  return clampPercent(matched ? Number(matched[0]) : 0)
})

const scoreHint = computed(() => {
  if (matchScore.value >= 80) return '匹配度很高，可以优先投递这类岗位。'
  if (matchScore.value >= 60) return '整体匹配，补齐关键技能后竞争力更强。'
  if (matchScore.value > 0) return '匹配较低，建议优先补齐待补充技能。'
  return '分析生成后，这里会展示匹配度评分。'
})

const toFacts = (labels: string[], source: Record<string, string>) =>
  labels.map((label) => ({ label, value: source[label] || '—' }))

const techFacts = computed(() => toFacts(['已匹配技能', '缺失技能', '多余技能'], pairs.value.tech))
const conditionFacts = computed(() =>
  toFacts(
    ['是否同城', '是否支持远程', '是否达标', '学历要求'],
    { ...pairs.value.city, ...pairs.value.education },
  ),
)
const salaryFacts = computed(() => toFacts(['重叠百分比', '偏差百分比'], pairs.value.salary))
const advice = computed(() => sectionItems(sections.value, '建议'))

// ---------- 请求 ----------
/** 中止进行中的请求 */
const stop = () => {
  controller?.abort()
  controller = null
  loading.value = false
}

/** 清空结果并中止请求 */
const reset = () => {
  stop()
  content.value = ''
  score.value = null
  error.value = ''
  // 切换岗位后允许立即发起新请求，不被上一个岗位的防抖窗口挡住
  lastRunAt = 0
}

/** 发起（或重新发起）匹配分析 */
const run = async (force = false) => {
  if (loading.value) return

  // 防抖：距上次请求不足 MATCH_DEBOUNCE 毫秒直接忽略
  const now = Date.now()
  if (now - lastRunAt < MATCH_DEBOUNCE) return
  lastRunAt = now

  if (!getToken()) {
    error.value = '登录后才能分析匹配度'
    return
  }

  content.value = ''
  score.value = null
  error.value = ''
  loading.value = true

  const current = new AbortController()
  controller = current

  try {
    await streamMatch({
      jobId: props.jobId,
      force,
      signal: current.signal,
      onMeta: (meta) => {
        if (meta.score != null) score.value = meta.score
      },
      onDelta: (delta) => {
        content.value += delta
      },
    })
  } catch (e) {
    if (current.signal.aborted) return
    error.value = e instanceof Error ? e.message : 'AI 分析失败'
  } finally {
    if (controller === current) {
      controller = null
      loading.value = false
    }
  }
}

const close = () => {
  visible.value = false
}

const goLogin = () => {
  visible.value = false
  router.push('/login')
}

// 打开即分析，关闭时中止请求
watch(visible, (open) => {
  if (open) run()
  else stop()
})

// 面板打开时切换岗位，重新分析
watch(
  () => props.jobId,
  () => {
    reset()
    if (visible.value) run()
  },
)

onBeforeUnmount(stop)
</script>

<style scoped lang="scss">
.ai-match {
  --report-primary: #007c77;
  --report-ink: #17252b;
  --report-text: #3d4b54;
  --report-muted: #65747c;
  --report-faint: #8a979e;
  --report-border: #edf2f2;

  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  .ai-match__card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #dde8e6;
    box-shadow: 0 18px 48px rgba(11, 60, 57, 0.14);
  }

  .ai-match__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px 12px;
    background: linear-gradient(180deg, #eef9f7 0%, #ffffff 100%);
    border-bottom: 1px solid var(--report-border);
  }

  .ai-match__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--report-ink);
  }

  .ai-match__sub {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: var(--report-muted);
  }

  .ai-match__close {
    flex-shrink: 0;
    color: #8a979e;

    &:hover {
      color: var(--report-primary);
    }
  }

  .ai-match__body {
    flex: 1;
    min-height: 0;
    padding: 4px 20px 20px;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .ai-match__hint {
    margin: 12px 0 0;
    font-size: 12.5px;
    color: var(--report-muted);
  }

  .ai-match__error {
    margin: 12px 0 0;
    font-size: 12.5px;
    color: #b4413f;
  }

  .ai-match__content {
    margin-top: 12px;
    font-size: 12.5px;
    line-height: 1.85;
    color: var(--report-text);
    word-break: break-word;
    white-space: pre-wrap;
  }

  .ai-match__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 20px;
    border-top: 1px solid var(--report-border);
  }

  .ai-match__btn {
    height: 34px;
    padding: 0 16px;
    font-size: 12px;
    border-radius: 8px;

    --el-button-text-color: var(--report-text);
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--report-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
    --el-button-active-border-color: #bfdcd7;

    &.el-button--primary {
      --el-button-text-color: #ffffff;
      --el-button-bg-color: var(--report-primary);
      --el-button-border-color: var(--report-primary);
      --el-button-hover-text-color: #ffffff;
      --el-button-hover-bg-color: #006b66;
      --el-button-hover-border-color: #006b66;
      --el-button-active-bg-color: #00605c;
      --el-button-active-border-color: #00605c;
    }
  }

  /* ---------- 指标区：与个人技能评估报告一致 ---------- */
  .report__metrics {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    padding: 20px 0 22px;
    margin-top: 16px;
    border-top: 1px solid var(--report-border);
    border-bottom: 1px solid var(--report-border);
  }

  .report__label {
    display: block;
    font-size: 11.5px;
    line-height: 18px;
    color: #78868f;
  }

  .report__score-value {
    display: block;
    margin-top: 6px;
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -2px;
    color: var(--report-primary);
  }

  .report__above {
    padding-left: 24px;
    border-left: 1px solid var(--report-border);
  }

  .report__above-value {
    display: block;
    margin-top: 8px;
    font-size: 34px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -1px;
    color: var(--report-ink);
  }

  .report__hint {
    margin: 10px 0 0;
    font-size: 12px;
    line-height: 19px;
    color: var(--report-muted);
  }

  .report__bar {
    height: 3px;
    margin-top: 14px;
    overflow: hidden;
    background: #e4edea;
    border-radius: 2px;

    span {
      display: block;
      height: 100%;
      background: var(--report-primary);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  }

  /* ---------- 两列报告块 ---------- */
  .report__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    margin-top: 22px;
  }

  .report__col {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
  }

  .report-block__title {
    display: flex;
    gap: 10px;
    align-items: baseline;
    justify-content: space-between;
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    letter-spacing: -0.3px;
    color: var(--report-ink);
  }

  .report-block__count {
    font-size: 11.5px;
    font-weight: 400;
    color: var(--report-faint);
  }

  .report__facts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 22px;
  }

  .report__fact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 108px;

    strong {
      font-size: 13.5px;
      font-weight: 500;
      line-height: 20px;
      color: var(--report-ink);
      word-break: break-word;
    }
  }

  .report__empty {
    margin: 0;
    font-size: 12.5px;
    line-height: 20px;
    color: #a1acb3;
  }

  .report-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .report-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 12.5px;
    line-height: 20px;
    color: var(--report-text);

    > span:last-child {
      min-width: 0;
    }
  }

  .report-item__index {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    font-size: 11px;
    font-weight: 600;
    color: var(--report-primary);
    background: #e8f7f4;
    border-radius: 50%;
  }
}

// 盖住父级卡片
.ai-match--panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 10px;
  background: rgba(247, 251, 250, 0.78);
  backdrop-filter: blur(6px);

  .ai-match__card {
    height: 100%;
    border-radius: 14px;
  }
}

// 盖住整个页面
.ai-match--page {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 60, 57, 0.38);
  backdrop-filter: blur(4px);

  .ai-match__card {
    width: min(880px, 100%);
    max-height: 84vh;
    border-radius: 18px;
  }

  @media (max-width: 640px) {
    padding: 12px;
  }
}

// 窄屏单列，避免报告块被压得太窄
@media (max-width: 767.98px) {
  .ai-match {
    .report__body {
      grid-template-columns: minmax(0, 1fr);
    }

    .report__metrics {
      gap: 18px;
    }

    .report__above {
      padding-left: 18px;
    }
  }
}

.match-fade-enter-active,
.match-fade-leave-active {
  transition: opacity 0.18s ease;
}

.match-fade-enter-from,
.match-fade-leave-to {
  opacity: 0;
}
</style>
