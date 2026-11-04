<template>
  <article class="report">
    <header class="report__head">
      <p class="report__crumb">
        分析报告
        <span class="report__crumb-sep">/</span>
        <span class="report__crumb-current">{{ modeTitle }}</span>
      </p>
      <el-button class="report__restart" @click="emit('restart')">重新分析</el-button>
    </header>

    <h1 class="report__title">{{ resultTitle }}</h1>
    <p class="report__sub">{{ resultSub }}</p>

    <!-- 拒绝 / 失败 / 等待 -->
    <div v-if="refused" class="report__notice">
      {{ refuseReason || '该内容无法分析' }}
    </div>
    <p v-else-if="error" class="report__notice report__notice--error">{{ error }}</p>
    <div v-else-if="loading && !sections.length" class="ai-typing" aria-label="分析中">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <!-- 技术栈分析 -->
    <template v-if="mode === '1' && !refused && !error">
      <div class="report__metrics">
        <section class="report__score">
          <span class="report__label">匹配度评分</span>
          <strong class="report__score-value">{{ matchScore }}%</strong>
          <p class="report__hint">{{ scoreHint }}</p>
        </section>

        <section class="report__above">
          <span class="report__label">超越比例</span>
          <strong class="report__above-value">{{ abovePercent }}%</strong>
          <p class="report__hint">超过同岗位求职者</p>
          <div class="report__bar">
            <span :style="{ width: `${abovePercent}%` }"></span>
          </div>
        </section>
      </div>

      <div class="report__body">
        <div class="report__col">
          <section class="report-block">
            <h2 class="report-block__title">
              目标岗位与薪资
            </h2>
            <div class="report__facts">
              <div class="report__fact">
                <span class="report__label">目标岗位</span>
                <strong>{{ targetJob || '—' }}</strong>
              </div>
              <div class="report__fact">
                <span class="report__label">月薪预估</span>
                <strong>{{ salaryRange || '—' }}</strong>
              </div>
              <div class="report__fact">
                <span class="report__label">市场中位数</span>
                <strong>{{ salaryMedian || '—' }}</strong>
              </div>
            </div>
          </section>

          <section class="report-block">
            <h2 class="report-block__title">
              求职建议
            </h2>
            <ol v-if="jobAdvice.length" class="report-list">
              <li v-for="(text, index) in jobAdvice" :key="text" class="report-item">
                <span class="report-item__index">{{ index + 1 }}</span>
                <span>{{ text }}</span>
              </li>
            </ol>
            <p v-else class="report__empty">—</p>
          </section>
        </div>

        <div class="report__col">
          <section class="report-block">
            <h2 class="report-block__title">
              核心优势
              <span class="report-block__count">{{ coreAdvantages.length }} 项</span>
            </h2>
            <ul v-if="coreAdvantages.length" class="report-list">
              <li v-for="text in coreAdvantages" :key="text" class="report-item">
                <span class="report-item__dot"></span>
                <span>{{ text }}</span>
              </li>
            </ul>
            <p v-else class="report__empty">暂未识别到明显优势</p>
          </section>

          <section class="report-block">
            <h2 class="report-block__title">
              待补充技能
              <span class="report-block__count">{{ skillGaps.length }} 项</span>
            </h2>
            <ul v-if="skillGaps.length" class="report-list">
              <li v-for="text in skillGaps" :key="text" class="report-item">
                <span class="report-item__dot report-item__dot--warm"></span>
                <span>{{ text }}</span>
              </li>
            </ul>
            <p v-else class="report__empty">补充技术栈后，这里会列出优先补齐的技能。</p>
          </section>
        </div>
      </div>
    </template>

    <!-- JD 岗位拆解 -->
    <template v-if="mode === '2' && !refused && !error">
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
                  <span v-for="item in duty.value" :key="item" class="report-tag" :style="tagStyle(item)">{{ item }}</span>
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
              <div v-for="(item, index) in jdInterviewPrep" :key="index" class="report-dimension report-dimension--warm">
                <span class="report-dimension__label">{{ item.label }}</span>
                <span class="report-dimension__value">{{ item.value }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>

    <p class="report__foot">结果基于当前简历与岗位 JD 生成，仅供参考。</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  sectionItems,
  sectionNumber,
  sectionText,
} from '@/utils/aiText'
import type { AISection } from '@/utils/aiText'

const props = defineProps<{
  /** 1 = 技术栈分析，2 = JD 岗位拆解 */
  mode: string
  /** AI 输出解析后的小节 */
  sections: AISection[]
  /** 流式输出中 */
  loading: boolean
  /** 模型判定内容无法分析 */
  refused: boolean
  refuseReason: string
  error: string
}>()

const emit = defineEmits<{ restart: [] }>()

// 进度条与百分比不允许超过 100
const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const modeTitle = computed(() => (props.mode === '1' ? '技术栈分析' : 'JD 岗位拆解'))
const resultTitle = computed(() => (props.mode === '1' ? '你的匹配结果' : '岗位拆解结果'))
const resultSub = computed(() =>
  props.mode === '1' ? '基于当前简历与岗位 JD 综合生成' : '基于岗位 JD 拆解生成',
)

// ---------- 技术栈分析 ----------
const matchScore = computed(() => clampPercent(sectionNumber(props.sections, '匹配度评分')))
const abovePercent = computed(() => clampPercent(sectionNumber(props.sections, '超越比例')))
const salaryRange = computed(() => sectionText(props.sections, '薪资预估'))
const targetJob = computed(() => sectionText(props.sections, '目标岗位'))
const salaryMedian = computed(() => sectionText(props.sections, '市场中位数'))
const coreAdvantages = computed(() => sectionItems(props.sections, '核心优势'))
const skillGaps = computed(() => sectionItems(props.sections, '待补充技能'))
const jobAdvice = computed(() => sectionItems(props.sections, '求职建议'))

const scoreHint = computed(() => {
  if (matchScore.value >= 80) return '匹配度很高，可以优先投递这类岗位。'
  if (matchScore.value >= 60) return '整体匹配，补齐关键技能后竞争力更强。'
  if (matchScore.value > 0) return '匹配较低，建议优先补齐待补充技能。'
  return '补充技术栈后，这里会生成匹配度评分。'
})

// ---------- JD 岗位拆解 ----------
const JD_BASIC_FIELDS = ['职位名称', '所属部门', '工作地点', '薪资范围']

const jdBasicInfo = computed(() =>
  JD_BASIC_FIELDS.map((label) => {
    const item = sectionItems(props.sections, '岗位基本信息').find((text) => text.startsWith(label))
    const value = item?.slice(label.length).replace(/^[：:]\s*/, '').trim()
    return { label, value: value || '未提及' }
  }),
)

const JD_DUTIES_FIELDS = ['日常做什么', '核心产出', '协作对象', '优先级判断']

const jdDuties = computed(() =>
  JD_DUTIES_FIELDS.map((label) => {
    const item = sectionItems(props.sections, '岗位职责').find((text) => text.startsWith(label))
    const value = item?.slice(label.length).replace(/^[：:]\s*/, '').trim()
    return { label, value: value || '未提及' }
  }),
)

const KNOWLEDGE_FIELDS = ['硬性要求', '软性要求']

const knowledgeRequirements = computed(() =>
  KNOWLEDGE_FIELDS.map((label) => {
    const item = sectionItems(props.sections, '认知要求').find((text) => text.startsWith(label)) || ''
    const text = item.slice(label.length).replace(/^[：:]\s*/, '').trim()
    const value = text ? text.split('、').filter(Boolean) : []
    return { label, value: value.length ? value : ['未提及'] }
  }),
)

// 「维度：内容」类小节（隐藏信息 / 面试准备方向）：按第一个冒号拆成标签与内容
const splitPairs = (title: string) =>
  sectionItems(props.sections, title).map((text) => {
    const match = /^(.+?)[：:]\s*(.*)$/.exec(text.trim())
    return match ? { label: match[1]!, value: match[2]! } : { label: '', value: text }
  })

const jdHiddenInfo = computed(() => splitPairs('隐藏信息'))
const jdInterviewPrep = computed(() => splitPairs('面试准备方向'))

/** 认知要求标签的浅色底配色 */
const TAG_COLORS: { bg: string; color: string }[] = [
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
</script>

<style scoped lang="scss">
.report {
  --report-primary: #007c77;
  --report-ink: #17252b;
  --report-text: #3d4b54;
  --report-muted: #65747c;
  --report-faint: #8a979e;
  --report-border: #edf2f2;

  padding: 36px 40px 28px;
  background: #ffffff;
  border: 1px solid #dde8e6;
  border-radius: 18px;
}

.report__head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.report__crumb {
  margin: 0;
  font-size: 11.5px;
  line-height: 18px;
  color: #78868f;
}

.report__crumb-sep {
  margin: 0 6px;
  color: #b1bec0;
}

.report__crumb-current {
  font-weight: 500;
  color: var(--report-muted);
}

.report__restart {
  flex-shrink: 0;
  height: 36px;
  padding: 0 16px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 9px;

  --el-button-text-color: var(--report-primary);
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #cfe1dd;
  --el-button-hover-text-color: var(--report-primary);
  --el-button-hover-bg-color: #f3faf8;
  --el-button-hover-border-color: #bfe3dd;
}

.report__title {
  margin: 20px 0 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 44px;
  letter-spacing: -1px;
  color: var(--report-ink);
}

.report__sub {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--report-muted);
}

/* ---------- 提示 ---------- */
.report__notice {
  padding: 14px 16px;
  margin: 24px 0 0;
  font-size: 13.5px;
  line-height: 22px;
  color: #8a5a16;
  background: #fff8ec;
  border-radius: 10px;
}

.report__notice--error {
  color: #b4413f;
  background: #fef2f2;
}

.report__empty {
  margin: 0;
  font-size: 12.5px;
  line-height: 20px;
  color: #a1acb3;
}

/* 流式输出前的等待动画 */
.ai-typing {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 8px 0;

  span {
    width: 6px;
    height: 6px;
    background: #b7cfca;
    border-radius: 50%;
    animation: ai-typing 1.2s infinite ease-in-out;
  }

  span:nth-child(2) {
    animation-delay: 0.15s;
  }

  span:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes ai-typing {

  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* ---------- 匹配度 / 超越比例 ---------- */
.report__metrics {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 40px;
  padding: 28px 0 30px;
  margin-top: 24px;
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
  font-size: 80px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -3px;
  color: var(--report-primary);
}

.report__above {
  padding-left: 40px;
  border-left: 1px solid var(--report-border);
}

.report__above-value {
  display: block;
  margin-top: 8px;
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.4px;
  color: var(--report-ink);
}

.report__hint {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 20px;
  color: var(--report-muted);
}

.report__bar {
  height: 3px;
  margin-top: 16px;
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

/* ---------- 两列内容 ---------- */
.report__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 40px;
  margin-top: 30px;
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

.report-block__count {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--report-faint);
}

.report__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.report__fact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;

  strong {
    font-size: 20px;
    font-weight: 500;
    line-height: 28px;
    color: var(--report-ink);
  }
}

/* ---------- 列表 ---------- */
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
  font-size: 13.5px;
  line-height: 22px;
  color: var(--report-text);

  >span:last-child {
    min-width: 0;
  }
}

.report-item__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 8px;
  background: #2e9e6f;
  border-radius: 50%;
}

.report-item__dot--warm {
  background: #d98e2b;
}

.report-item__index {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--report-primary);
  background: #e8f7f4;
  border-radius: 50%;
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

@media (max-width: 960px) {
  .report {
    padding: 24px;
    border-radius: 14px;
  }

  .report__title {
    font-size: 26px;
    line-height: 34px;
  }

  .report__metrics,
  .report__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .report__above {
    padding-left: 0;
    border-left: 0;
  }
}
</style>
