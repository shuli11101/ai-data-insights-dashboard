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

    <!-- 个人技能评估 -->
    <template v-if="mode === '1' && !refused && !error">
      <SkillReport v-if="sections.length" :sections="sections" />
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

import { sectionItems } from '@/utils/aiText'
import type { AISection } from '@/utils/aiText'

import SkillReport from './skill-report.vue'

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

const modeTitle = computed(() => (props.mode === '1' ? '技术栈分析' : 'JD 岗位拆解'))
const resultTitle = computed(() => (props.mode === '1' ? '你的匹配结果' : '岗位拆解结果'))
const resultSub = computed(() =>
  props.mode === '1' ? '基于当前简历与岗位 JD 综合生成' : '基于岗位 JD 拆解生成',
)

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

  .report__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
