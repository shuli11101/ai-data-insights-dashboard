<!--
  JD 岗位分析面板
  - 调用与「AI 分析 - JD 岗位拆解」相同的接口（/api/ai/chat，scene: 'jd'）
  - 展示与 analysis-report.vue 的 JD 拆解结果完全一致：
    岗位基本信息 / 岗位职责 / 认知要求 / 隐藏信息 / 面试准备方向
  - mode="panel"：绝对定位，盖住所处的卡片；mode="page"：固定定位，盖住整个页面
-->
<template>
  <teleport to="body" :disabled="mode === 'panel'">
    <transition name="jd-fade">
      <div v-if="visible" class="jd" :class="`jd--${mode}`">
        <section class="jd__card" role="dialog" aria-modal="true" aria-label="JD 岗位分析">
          <header class="jd__head">
            <div class="jd__titles">
              <h3 class="jd__title">JD 岗位描述</h3>
              <p class="jd__sub">{{ subtitle }}</p>
            </div>
            <el-button text circle class="jd__close" :icon="Close" aria-label="关闭" @click="close" />
          </header>

          <div class="jd__body">
            <!-- 等待首个小节 -->
            <p v-if="loading && !hasResult" class="jd__hint">正在生成 JD 分析…</p>
            <p v-if="error" class="jd__error">{{ error }}</p>
            <p v-else-if="refused" class="jd__notice">{{ refuseReason }}</p>

            <!-- JD 拆解结果：与 analysis-report 的 mode=2 展示一致 -->
            <template v-if="hasResult">
              <div class="report__body">
                <div class="report__col">
                  <section class="report-block">
                    <h2 class="report-block__title">岗位基本信息</h2>
                    <div class="report-kv-list">
                      <div v-for="field in jdBasicInfo" :key="field.label" class="report-kv">
                        <span class="report-kv__label">{{ field.label }}</span>
                        <span class="report-kv__value">{{ field.value }}</span>
                      </div>
                    </div>
                  </section>

                  <section class="report-block">
                    <h2 class="report-block__title">岗位职责</h2>
                    <div class="report-kv-list">
                      <div v-for="duty in jdDuties" :key="duty.label" class="report-kv">
                        <span class="report-kv__label">{{ duty.label }}</span>
                        <span class="report-kv__value">{{ duty.value }}</span>
                      </div>
                    </div>
                  </section>

                  <section class="report-block">
                    <h2 class="report-block__title">认知要求</h2>
                    <div class="report-kv-list">
                      <div v-for="duty in knowledgeRequirements" :key="duty.label" class="report-kv">
                        <span class="report-kv__label">{{ duty.label }}</span>
                        <span class="report-kv__value report-kv__value--tags">
                          <span v-for="item in duty.value" :key="item" class="report-tag"
                            :style="tagStyle(item)">{{ item }}</span>
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="report__col">
                  <section v-if="jdHiddenInfo.length" class="report-block">
                    <h2 class="report-block__title">隐藏信息</h2>
                    <div class="report-dimension-list">
                      <div v-for="(item, index) in jdHiddenInfo" :key="index" class="report-dimension">
                        <span class="report-dimension__label">{{ item.label }}</span>
                        <span class="report-dimension__value">{{ item.value }}</span>
                      </div>
                    </div>
                  </section>

                  <section v-if="jdInterviewPrep.length" class="report-block">
                    <h2 class="report-block__title">面试准备方向</h2>
                    <div class="report-dimension-list">
                      <div v-for="(item, index) in jdInterviewPrep" :key="index"
                        class="report-dimension report-dimension--warm">
                        <span class="report-dimension__label">{{ item.label }}</span>
                        <span class="report-dimension__value">{{ item.value }}</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <p class="report__foot">结果基于岗位 JD 生成，仅供参考。</p>
            </template>

            <!-- 模型没按小节输出时兜底显示原文 -->
            <div v-else-if="raw && !refused" class="jd__content">{{ raw }}</div>
          </div>

          <footer class="jd__foot">
            <el-button class="jd__btn" @click="close">关闭</el-button>
            <el-button v-if="loggedIn && job" class="jd__btn jd__btn--primary" :loading="loading" @click="run">
              重新分析
            </el-button>
            <el-button v-else-if="!loggedIn" class="jd__btn jd__btn--primary" @click="goLogin">去登录</el-button>
          </footer>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'

import { useAIStream } from '@/composables/useAIStream'
import { sectionItems } from '@/utils/aiText'
import { getToken } from '@/utils/token'
import type { JobDetail } from '@/api/server'

const props = withDefaults(defineProps<{
  /** 要分析的岗位；查看已保存报告时可不传 */
  job?: JobDetail | null
  /** panel = 盖住父级卡片，page = 盖住整个页面 */
  mode?: 'panel' | 'page'
  /** 已保存的分析结果：传入后直接展示，不再请求接口 */
  initialContent?: string
  /** 无 job 时用于副标题的标题文本 */
  title?: string
}>(), {
  job: null,
  mode: 'page',
  initialContent: '',
  title: '',
})

/** 面板显隐，由父组件 v-model 控制；打开时自动发起分析 */
const visible = defineModel<boolean>({ default: false })

const router = useRouter()

// 与分析页共用同一套流式状态与请求逻辑（scene 由 run 时指定）
const { raw, sections, hasResult, loading, error, start, stop, reset, refused, refuseReason } =
  useAIStream()

const loggedIn = computed(() => Boolean(getToken()))

/** 副标题：优先用岗位信息，查看已保存报告时退回标题 */
const subtitle = computed(() =>
  props.job ? `${props.job.job_name} · ${props.job.company}` : props.title,
)

/** 把岗位字段拼成 JD 文本，作为 jd 场景的输入 */
const jdText = computed(() => {
  const job = props.job
  if (!job) return ''
  const location = [job.city, job.district].filter(Boolean).join(' ')
  return [
    `职位名称：${job.job_name}`,
    `公司：${job.company}`,
    `工作地点：${location || '未提及'}`,
    `薪资范围：${job.salary_min}k-${job.salary_max}k`,
    `经验要求：${job.experience || '未提及'}`,
    `技能标签：${job.skill_tags.join('、') || '未提及'}`,
  ].join('\n')
})

// ---------- 结果解析：与 analysis-report.vue 的 JD 岗位拆解一致 ----------

const JD_BASIC_FIELDS = ['职位名称', '所属部门', '工作地点', '薪资范围']

const jdBasicInfo = computed(() =>
  JD_BASIC_FIELDS.map((label) => {
    const item = sectionItems(sections.value, '岗位基本信息').find((text) => text.startsWith(label))
    const value = item?.slice(label.length).replace(/^[：:]\s*/, '').trim()
    return { label, value: value || '未提及' }
  }),
)

const JD_DUTIES_FIELDS = ['日常做什么', '核心产出', '协作对象', '优先级判断']

const jdDuties = computed(() =>
  JD_DUTIES_FIELDS.map((label) => {
    const item = sectionItems(sections.value, '岗位职责').find((text) => text.startsWith(label))
    const value = item?.slice(label.length).replace(/^[：:]\s*/, '').trim()
    return { label, value: value || '未提及' }
  }),
)

const KNOWLEDGE_FIELDS = ['硬性要求', '软性要求']

const knowledgeRequirements = computed(() =>
  KNOWLEDGE_FIELDS.map((label) => {
    const item = sectionItems(sections.value, '认知要求').find((text) => text.startsWith(label)) || ''
    const text = item.slice(label.length).replace(/^[：:]\s*/, '').trim()
    const value = text ? text.split('、').filter(Boolean) : []
    return { label, value: value.length ? value : ['未提及'] }
  }),
)

// 「维度：内容」类小节（隐藏信息 / 面试准备方向）：按第一个冒号拆成标签与内容
const splitPairs = (title: string) =>
  sectionItems(sections.value, title).map((text) => {
    const match = /^(.+?)[：:]\s*(.*)$/.exec(text.trim())
    return match ? { label: match[1]!, value: match[2]! } : { label: '', value: text }
  })

const jdHiddenInfo = computed(() => splitPairs('隐藏信息'))
const jdInterviewPrep = computed(() => splitPairs('面试准备方向'))

/** 认知要求标签的浅色底配色 */
const TAG_COLORS: { bg: string, color: string }[] = [
  { bg: '#E8F7F4', color: '#007C77' },
  { bg: '#EAF7EE', color: '#529B67' },
  { bg: '#FFF3E6', color: '#C77C2B' },
  { bg: '#F3EEFF', color: '#7A5AF8' },
  { bg: '#FFEFEF', color: '#D96A6A' },
  { bg: '#EAF3FF', color: '#3D74FF' },
]

// 按文字内容取色而不是随机数：流式逐字渲染时同一条内容颜色不会跳变
const tagStyle = (text: string) => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973
  }
  const { bg, color } = TAG_COLORS[hash % TAG_COLORS.length]!
  return { backgroundColor: bg, color }
}

// ---------- 请求 ----------
/** 有已保存的分析结果时直接展示，不再请求接口 */
const applyPreset = () => {
  const preset = props.initialContent?.trim()
  if (!preset) return false

  reset()
  raw.value = preset
  return true
}

/** 打开面板：有已保存结果直接展示，否则发起分析 */
const open = () => {
  if (!applyPreset()) run()
}

/** 发起（或重新发起）JD 分析，请求方式与分析页的 JD 拆解一致 */
const run = async () => {
  if (loading.value) return

  if (!getToken()) {
    reset()
    error.value = '登录后才能生成 JD 分析'
    return
  }

  const input = jdText.value
  if (!input) {
    reset()
    error.value = '岗位信息不完整，无法分析'
    return
  }

  await start({ scene: 'jd', input })
}

const close = () => {
  visible.value = false
}

const goLogin = () => {
  visible.value = false
  router.push('/login')
}

// 打开即加载；immediate 兼容「组件创建时就已是打开状态」（如报告列表直接点开）
watch(
  visible,
  (isOpen) => {
    if (isOpen) open()
    else stop()
  },
  { immediate: true },
)

// 面板打开时切换岗位，重新分析
watch(
  () => props.job?.id,
  () => {
    reset()
    if (visible.value) open()
  },
)

// 同一面板内切换到另一份已保存结果时，直接替换内容
watch(
  () => props.initialContent,
  () => {
    if (visible.value) open()
  },
)

onBeforeUnmount(stop)
</script>

<style scoped lang="scss">
.jd {
  --report-primary: #007c77;
  --report-ink: #17252b;
  --report-text: #3d4b54;
  --report-muted: #65747c;
  --report-faint: #8a979e;
  --report-border: #edf2f2;

  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  .jd__card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #dde8e6;
    box-shadow: 0 18px 48px rgba(11, 60, 57, 0.14);
  }

  .jd__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px 12px;
    background: linear-gradient(180deg, #eef9f7 0%, #ffffff 100%);
    border-bottom: 1px solid var(--report-border);
  }

  .jd__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--report-ink);
  }

  .jd__sub {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: var(--report-muted);
  }

  .jd__close {
    flex-shrink: 0;
    color: #8a979e;

    &:hover {
      color: var(--report-primary);
    }
  }

  .jd__body {
    flex: 1;
    min-height: 0;
    padding: 4px 20px 20px;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .jd__hint {
    margin: 12px 0 0;
    font-size: 12.5px;
    color: var(--report-muted);
  }

  .jd__error {
    margin: 12px 0 0;
    font-size: 12.5px;
    color: #b4413f;
  }

  .jd__notice {
    padding: 8px 12px;
    margin: 12px 0 0;
    font-size: 12.5px;
    line-height: 20px;
    color: #8a6d3b;
    background: #fdf8ec;
    border-radius: 8px;
  }

  .jd__content {
    margin-top: 12px;
    font-size: 12.5px;
    line-height: 1.85;
    color: var(--report-text);
    word-break: break-word;
    white-space: pre-wrap;
  }

  .jd__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 20px;
    border-top: 1px solid var(--report-border);
  }

  .jd__btn {
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

  /* ---------- 两列内容：与 analysis-report.vue 一致 ---------- */
  .report__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 40px;
    margin-top: 24px;
  }

  .report__col {
    display: flex;
    flex-direction: column;
    gap: 30px;
    min-width: 0;
  }

  .report-block__title {
    display: flex;
    gap: 10px;
    align-items: baseline;
    justify-content: space-between;
    margin: 0 0 14px;
    font-size: 18px;
    font-weight: 600;
    line-height: 26px;
    letter-spacing: -0.3px;
    color: var(--report-ink);
  }

  /* ---------- JD：字段行 ---------- */
  .report-kv-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .report-kv {
    display: flex;
    gap: 12px;
    font-size: 13.5px;
    line-height: 22px;
  }

  .report-kv__label {
    flex: 0 0 5.2em;
    color: var(--report-faint);
  }

  .report-kv__value {
    flex: 1;
    min-width: 0;
    color: var(--report-ink);
    word-break: break-word;
  }

  .report-kv__value--tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  .report-tag {
    padding: 2px 8px;
    font-size: 12px;
    line-height: 18px;
    border-radius: 8px;
  }

  /* ---------- JD：维度结论 ---------- */
  .report-dimension-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .report-dimension {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 10px;
    border-left: 2px solid var(--report-primary);
  }

  .report-dimension--warm {
    border-left-color: #e0a75e;
  }

  .report-dimension__label {
    font-size: 13.5px;
    font-weight: 600;
    line-height: 22px;
    color: var(--report-ink);
  }

  .report-dimension__value {
    font-size: 13px;
    line-height: 21px;
    color: var(--report-muted);
  }

  .report__foot {
    padding-top: 20px;
    margin: 30px 0 0;
    font-size: 10.5px;
    line-height: 16px;
    color: var(--report-faint);
    border-top: 1px solid var(--report-border);
  }
}

// 盖住父级卡片
.jd--panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  padding: 10px;
  background: rgba(247, 251, 250, 0.78);
  backdrop-filter: blur(6px);

  .jd__card {
    height: 100%;
    border-radius: 14px;
  }
}

// 盖住整个页面
.jd--page {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 60, 57, 0.38);
  backdrop-filter: blur(4px);

  .jd__card {
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
  .jd {
    .report__body {
      grid-template-columns: minmax(0, 1fr);
      gap: 24px;
    }

    .report-block__title {
      font-size: 16px;
      line-height: 22px;
    }
  }
}

.jd-fade-enter-active,
.jd-fade-leave-active {
  transition: opacity 0.18s ease;
}

.jd-fade-enter-from,
.jd-fade-leave-to {
  opacity: 0;
}
</style>
