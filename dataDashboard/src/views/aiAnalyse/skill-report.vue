<!--
  个人技能评估报告（scene: skill）
  按 AI 输出的 7 个小节渲染：
  竞争力评分 / 市场定位 / 薪资区间 / 能力雷达 / 技能清单 / 关键差距 / 提升计划
  各小节内部统一按「名称：值」解析，AI 输出格式由后端 Spring 项目维护
-->
<template>
  <article class="skill">
    <!-- 竞争力评分：大数字仪表盘 + 市场定位一句话结论 -->
    <section class="skill-hero">
      <div class="skill-hero__score">
        <p class="skill-kicker">竞争力评分</p>
        <el-progress type="dashboard" :percentage="score" :width="172" :stroke-width="12" color="#007c77">
          <template #default="{ percentage }">
            <span class="skill-hero__value">{{ percentage }}</span>
            <span class="skill-hero__unit">/ 100</span>
          </template>
        </el-progress>
      </div>

      <div class="skill-hero__position">
        <p class="skill-kicker">市场定位</p>
        <p class="skill-hero__sentence">{{ positioning || '正在生成市场定位…' }}</p>
      </div>
    </section>

    <!-- 薪资区间：与用户填写的期望薪资并排对比 -->
    <section class="skill-card">
      <header class="skill-card__head">
        <h2 class="skill-card__title">薪资区间</h2>
        <el-tag :type="salaryGap.type" effect="light" round size="small">{{ salaryGap.text }}</el-tag>
      </header>
      <div class="skill-salary">
        <div class="skill-salary__item">
          <span class="skill-salary__label">AI 预估区间</span>
          <strong class="skill-salary__value">{{ salaryRangeText || '—' }}</strong>
        </div>
        <span class="skill-salary__vs">VS</span>
        <div class="skill-salary__item">
          <span class="skill-salary__label">你的期望薪资</span>
          <strong class="skill-salary__value">{{ expectedText }}</strong>
          <RouterLink v-if="!expectedK" class="skill-salary__link" to="/personal-info">去填写</RouterLink>
        </div>
      </div>
    </section>

    <!-- 能力雷达 -->
    <section class="skill-card">
      <header class="skill-card__head">
        <h2 class="skill-card__title">能力雷达</h2>
        <span class="skill-card__meta">{{ radarPoints.length ? `${radarPoints.length} 个维度` : '' }}</span>
      </header>
      <div ref="radarEl" v-show="radarPoints.length >= 3" class="skill-radar"></div>
      <p v-if="radarPoints.length < 3" class="skill-empty">正在生成能力雷达…</p>
    </section>

    <!-- 技能清单：三列标签墙 -->
    <section class="skill-card">
      <header class="skill-card__head">
        <h2 class="skill-card__title">技能清单</h2>
        <span class="skill-card__meta">{{ skillTags.length ? `${skillTags.length} 项` : '' }}</span>
      </header>
      <div v-if="skillTags.length" class="skill-tags">
        <el-tag v-for="tag in skillTags" :key="tag" class="skill-tags__item" type="info" effect="plain" round>
          {{ tag }}
        </el-tag>
      </div>
      <p v-else class="skill-empty">正在整理技能清单…</p>
    </section>

    <!-- 关键差距：高优先级红色，其余黄色 -->
    <section class="skill-card">
      <header class="skill-card__head">
        <h2 class="skill-card__title">关键差距</h2>
        <span class="skill-card__meta">{{ gapTags.length ? `${gapTags.length} 项` : '' }}</span>
      </header>
      <div v-if="gapTags.length" class="skill-tags">
        <el-tag v-for="gap in gapTags" :key="gap.text" class="skill-tags__item skill-tags__item--gap"
          :type="gap.type" effect="light" round>
          {{ gap.text }}
        </el-tag>
      </div>
      <p v-else class="skill-empty">正在分析关键差距…</p>
    </section>

    <!-- 提升计划：时间轴 -->
    <section class="skill-card">
      <header class="skill-card__head">
        <h2 class="skill-card__title">提升计划</h2>
      </header>
      <el-timeline v-if="planItems.length" class="skill-timeline">
        <el-timeline-item v-for="item in planItems" :key="`${item.stage}-${item.content}`" :timestamp="item.stage"
          placement="top" color="#007c77">
          {{ item.content }}
        </el-timeline-item>
      </el-timeline>
      <p v-else class="skill-empty">正在制定提升计划…</p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'

import { useChart } from '@/composables/useChart'
import { usePersonalInfoStore } from '@/stores/personalInfo'
import { sectionItems, sectionNumber, sectionText } from '@/utils/aiText'
import type { AISection } from '@/utils/aiText'

const props = defineProps<{
  /** AI 输出解析后的小节 */
  sections: AISection[]
}>()

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

// ---------- 竞争力评分 / 市场定位 ----------
const score = computed(() => clampPercent(sectionNumber(props.sections, '竞争力评分')))
const positioning = computed(() => sectionText(props.sections, '市场定位'))

// ---------- 薪资区间与期望薪资对比 ----------
const personalInfo = usePersonalInfoStore()

/** 个人信息里的期望薪资以「元/月」存储，展示统一换算成 k */
const expectedK = computed(() => {
  const value = personalInfo.info?.expectedSalary
  return value == null ? null : Math.round(value / 1000)
})

const expectedText = computed(() => (expectedK.value == null ? '未填写' : `${expectedK.value}k`))

const salaryRangeText = computed(() => sectionText(props.sections, '薪资区间'))

/** 从「25k-38k」这类文本里取区间；数字大于 1000 视为元，统一换成 k */
const salaryBounds = computed(() => {
  const matched = /(\d+(?:\.\d+)?)\s*[kK千]?\s*[-~—–至到]\s*(\d+(?:\.\d+)?)\s*[kK千]?/.exec(
    salaryRangeText.value,
  )
  if (!matched) return null

  let low = Number(matched[1])
  let high = Number(matched[2])
  if (low >= 1000 || high >= 1000) {
    low /= 1000
    high /= 1000
  }
  return { min: Math.round(Math.min(low, high)), max: Math.round(Math.max(low, high)) }
})

type TagType = 'success' | 'warning' | 'danger' | 'info'

/** 期望薪资与预估区间的关系，决定标签文案与颜色 */
const salaryGap = computed<{ type: TagType; text: string }>(() => {
  const bounds = salaryBounds.value
  if (!bounds) return { type: 'info', text: '待生成' }

  const expected = expectedK.value
  if (expected == null) return { type: 'info', text: '未填写期望薪资' }
  if (expected < bounds.min) return { type: 'warning', text: `低于区间下限 ${bounds.min - expected}k` }
  if (expected > bounds.max) return { type: 'danger', text: `高于区间上限 ${expected - bounds.max}k` }
  return { type: 'success', text: '落在预估区间内' }
})

// ---------- 能力雷达 ----------
interface RadarPoint {
  name: string
  value: number
}

/** 「维度：分数」逐行解析，也兼容「维度 分数」的空格写法；最多展示 8 个维度 */
const radarPoints = computed<RadarPoint[]>(() =>
  sectionItems(props.sections, '能力雷达')
    .map((text) => {
      const matched =
        /^(.{1,20}?)\s*[：:]\s*(\d+(?:\.\d+)?)/.exec(text.trim()) ??
        /^(.{1,20}?)\s+(\d+(?:\.\d+)?)\s*$/.exec(text.trim())
      return matched
        ? { name: matched[1]!.trim(), value: clampPercent(Number(matched[2])) }
        : null
    })
    .filter((point): point is RadarPoint => point !== null)
    .slice(0, 8),
)

const radarEl = useChart((): EChartsOption => {
  // 少于 3 个维度画不出雷达，返回空配置避免 ECharts 报错
  if (radarPoints.value.length < 3) return {}

  return {
    radar: {
      indicator: radarPoints.value.map((point) => ({ name: point.name, max: 100 })),
      radius: '64%',
      splitNumber: 4,
      axisName: { color: '#65747c', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e4edea' } },
      splitLine: { lineStyle: { color: '#e4edea' } },
      splitArea: { areaStyle: { color: ['#ffffff', '#f7fbfa'] } },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: [{ value: radarPoints.value.map((point) => point.value), name: '能力评估' }],
        lineStyle: { color: '#007c77', width: 2 },
        itemStyle: { color: '#007c77' },
        areaStyle: { color: 'rgba(0, 124, 119, 0.16)' },
      },
    ],
  }
})

// ---------- 技能清单 ----------
/** 列表项可能用「、」或逗号合并成一行，统一拆成独立标签 */
const skillTags = computed(() => {
  const tags = sectionItems(props.sections, '技能清单')
    .flatMap((text) => text.split(/[、,，]/))
    .map((text) => text.trim())
    .filter(Boolean)
  return [...new Set(tags)]
})

// ---------- 关键差距 ----------
/** 含「高 / 紧急 / 核心」等字样的差距标红，其余标黄 */
const gapTags = computed(() =>
  sectionItems(props.sections, '关键差距').map((text) => ({
    text,
    type: /高|紧急|严重|核心|必须|优先/.test(text) ? ('danger' as const) : ('warning' as const),
  })),
)

// ---------- 提升计划 ----------
/** 「阶段：内容」拆成时间轴节点，没有阶段时按顺序编号 */
const planItems = computed(() =>
  sectionItems(props.sections, '提升计划').map((text, index) => {
    const matched = /^(.{1,12}?)[：:]\s*(.+)$/.exec(text)
    return matched
      ? { stage: matched[1]!.trim(), content: matched[2]!.trim() }
      : { stage: `步骤 ${index + 1}`, content: text }
  }),
)
</script>

<style scoped lang="scss">
.skill {
  --skill-primary: #007c77;
  --skill-ink: #17252b;
  --skill-text: #3d4b54;
  --skill-muted: #65747c;
  --skill-faint: #8a979e;
  --skill-border: #edf2f2;

  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 26px;
}

.skill-kicker {
  margin: 0;
  font-size: 11.5px;
  line-height: 18px;
  color: #78868f;
}

/* ---------- 评分 + 市场定位 ---------- */
.skill-hero {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 32px;
  align-items: center;
  padding: 24px 0 28px;
  border-top: 1px solid var(--skill-border);
  border-bottom: 1px solid var(--skill-border);
}

.skill-hero__score {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.skill-hero__value {
  display: block;
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.5px;
  color: var(--skill-primary);
}

.skill-hero__unit {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--skill-faint);
}

.skill-hero__position {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.skill-hero__sentence {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 30px;
  color: var(--skill-ink);
}

/* ---------- 通用卡片 ---------- */
.skill-card {
  padding: 22px 24px;
  background: #fbfdfd;
  border: 1px solid var(--skill-border);
  border-radius: 14px;
}

.skill-card__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.skill-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: -0.2px;
  color: var(--skill-ink);
}

.skill-card__meta {
  font-size: 11.5px;
  color: var(--skill-faint);
}

.skill-empty {
  margin: 0;
  font-size: 12.5px;
  line-height: 20px;
  color: #a1acb3;
}

/* ---------- 薪资对比 ---------- */
.skill-salary {
  display: flex;
  gap: 20px;
  align-items: center;
}

.skill-salary__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.skill-salary__label {
  font-size: 11.5px;
  line-height: 18px;
  color: #78868f;
}

.skill-salary__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 34px;
  letter-spacing: -0.6px;
  color: var(--skill-ink);
}

.skill-salary__link {
  font-size: 12px;
  color: var(--skill-primary);
  text-decoration: none;
}

.skill-salary__vs {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--skill-faint);
}

/* ---------- 雷达 ---------- */
.skill-radar {
  width: 100%;
  height: 280px;
}

/* ---------- 标签墙 ---------- */
.skill-tags {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.skill-tags__item {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  justify-self: stretch;
  text-align: center;
}

.skill-tags__item--gap {
  white-space: normal;
  text-align: left;
}

/* ---------- 时间轴 ---------- */
.skill-timeline {
  padding-left: 2px;

  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    font-weight: 600;
    color: var(--skill-primary);
  }

  :deep(.el-timeline-item__content) {
    font-size: 13.5px;
    line-height: 22px;
    color: var(--skill-text);
  }
}

@media (max-width: 960px) {
  .skill-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  .skill-tags {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skill-salary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
