<template>
  <!-- 首页右侧栏：跟随「热门职业」标签页切换的市场统计图 -->
  <ChartCard :title="activeChart.title" :subtitle="activeChart.subtitle" :height="300">
    <div ref="chartEl" v-loading="loading" class="side__chart"></div>
  </ChartCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'

import { getDistrict, getExperienceSalary, getSalaryRange, getSkillTags } from '@/api/server'
import { useChart } from '@/composables/useChart'

import ChartCard from '@/components/chart-card.vue'

/** 图表标识：一个标签页对应一个 */
type ChartKey = 'salary' | 'skill' | 'district' | 'experience'

interface Props {
  /** 当前选中的标签页名称，由首页的 el-tabs 传入 */
  tab: string
}

const props = defineProps<Props>()

/** 标签页 → 图表 的映射，调整对应关系只改这里 */
const CHART_BY_TAB: Record<string, ChartKey> = {
  热门技能: 'skill',
  薪资区间: 'salary',
  平均薪资: 'experience',
  城市分布: 'district',
}

/** 各图表的标题与说明 */
const CHART_META: Record<ChartKey, { title: string; subtitle: string }> = {
  salary: { title: '薪资区间分布', subtitle: '各薪资区间的岗位数量（单位：人）' },
  skill: { title: '热门技能 Top 8', subtitle: '岗位出现频次最高的技术栈' },
  district: { title: '城市分布', subtitle: '各城市岗位数量占比' },
  experience: { title: '经验与平均薪资', subtitle: '不同经验档位的平均月薪（单位：K）' },
}

// 配色：主色与站点青绿色保持一致
const PRIMARY = '#007c77'
const AXIS_TEXT = '#8a979e'
const VALUE_TEXT = '#3d4b54'
const SPLIT_LINE = '#edf2f2'
const PIE_COLORS = ['#007c77', '#2f9a94', '#54b0aa', '#7cc4bf', '#a3d7d3', '#c8e8e5', '#8fb8b3', '#b7cfcc', '#d9e4e2']

const loading = ref(true)

// 四个接口的数据，进入页面时一次性并行拉取，切标签页时不再请求
const salaryRanges = ref<{ salary_range: string, jobCount: number }[]>([])
const skillTags = ref<{ skill_tag: string, hot_count: number }[]>([])
const districts = ref<{ area_name: string, job_count: number }[]>([])
const experienceSalaries = ref<{ experience: string, avg_salary: number }[]>([])

/** 当前应展示的图表，未知标签页时兜底到热门技能 */
const activeKey = computed<ChartKey>(() => CHART_BY_TAB[props.tab] ?? 'skill')
const activeChart = computed(() => CHART_META[activeKey.value])

/** 横向条形图：类目在左、数值在右，适合侧栏这种窄容器 */
const buildHorizontalBarOption = (labels: string[], values: number[], color: string): EChartsOption => ({
  grid: { left: 0, right: 40, top: 8, bottom: 8, containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: labels,
    // inverse 让第一项显示在最上方，和接口返回的降序一致
    inverse: true,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontSize: 10, color: AXIS_TEXT, margin: 8 },
  },
  series: [
    {
      type: 'bar',
      data: values,
      barWidth: 8,
      itemStyle: { color, borderRadius: 3 },
      label: { show: true, position: 'right', distance: 6, fontSize: 10, color: VALUE_TEXT },
    },
  ],
})

/**
 * 竖向柱状图：类目在 X 轴，柱顶标数值。
 * 侧栏较窄，坐标轴文字统一压到 9px；barWidth 与柱顶文案可按场景覆盖。
 */
const buildVerticalBarOption = (
  labels: string[],
  values: number[],
  color: string,
  barWidth = 12,
  valueFormatter?: string,
): EChartsOption => ({
  grid: { left: 0, right: 4, top: 26, bottom: 0, containLabel: true },
  xAxis: {
    type: 'category',
    data: labels,
    axisLine: { lineStyle: { color: '#e2ebe9' } },
    axisTick: { show: false },
    axisLabel: { fontSize: 9, color: AXIS_TEXT, interval: 0 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: SPLIT_LINE } },
    axisLabel: { fontSize: 9, color: AXIS_TEXT },
  },
  series: [
    {
      type: 'bar',
      data: values,
      barWidth,
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      label: {
        show: true,
        position: 'top',
        fontSize: 9,
        color: VALUE_TEXT,
        ...(valueFormatter ? { formatter: valueFormatter } : {}),
      },
    },
  ],
})

/** 城市分布：环形图 + 底部图例 */
const buildDistrictOption = (): EChartsOption => ({
  color: PIE_COLORS,
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 个岗位（{d}%）' },
  legend: {
    type: 'scroll',
    bottom: 0,
    left: 'center',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 10,
    textStyle: { fontSize: 10, color: AXIS_TEXT },
  },
  series: [
    {
      type: 'pie',
      radius: ['42%', '66%'],
      center: ['50%', '44%'],
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#ffffff', borderWidth: 1 },
      data: districts.value.map((item) => ({ name: item.area_name, value: item.job_count })),
    },
  ],
})

/** 经验与平均薪资：同款竖向柱状图，柱更宽并在柱顶加 K 单位 */
const buildExperienceOption = (): EChartsOption =>
  buildVerticalBarOption(
    experienceSalaries.value.map((item) => item.experience),
    experienceSalaries.value.map((item) => item.avg_salary),
    PRIMARY,
    20,
    '{c}K',
  )

/** 按当前标签页产出对应配置；setOption 用 notMerge 覆盖，bar / pie 之间切换也能完全重置 */
const activeOption = computed<EChartsOption>(() => {
  switch (activeKey.value) {
    case 'salary':
      // 8 个档位并排在窄侧栏里，X 轴去掉 K 后缀避免文字互相挤压，单位已在副标题说明
      return buildVerticalBarOption(
        salaryRanges.value.map((item) => String(item.salary_range ?? '')),
        salaryRanges.value.map((item) => item.jobCount),
        PRIMARY,
      )
    case 'district':
      return buildDistrictOption()
    case 'experience':
      return buildExperienceOption()
    default:
      return buildHorizontalBarOption(
        skillTags.value.map((item) => item.skill_tag),
        skillTags.value.map((item) => item.hot_count),
        '#2f9a94',
      )
  }
})

// 图表容器：切换标签页由 watchEffect 自动触发 setOption
const chartEl = useChart(() => activeOption.value)

/** 四个统计接口并行请求，任一失败只影响对应图表 */
const loadCharts = async () => {
  try {
    const [salary, skills, district, experience] = await Promise.all([
      getSalaryRange(),
      getSkillTags(),
      getDistrict(),
      getExperienceSalary(),
    ])

    // 聚合结果统一转成数字，避免接口返回字符串时 ECharts 画不出柱体
    salaryRanges.value = salary.map((item) => ({
      salary_range: item.salary_range,
      jobCount: Number(item.jobCount),
    }))
    // 侧栏空间有限，技能只取热度前 8
    skillTags.value = skills.slice(0, 8).map((item) => ({
      skill_tag: item.skill_tag,
      hot_count: Number(item.hot_count),
    }))
    districts.value = district.map((item) => ({
      area_name: item.area_name,
      job_count: Number(item.job_count),
    }))
    experienceSalaries.value = experience.map((item) => ({
      experience: item.experience,
      avg_salary: Number(item.avg_salary),
    }))
  } catch (error) {
    console.log('获取首页统计数据失败：', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadCharts)
</script>

<style scoped lang="scss">
.side__chart {
  width: 100%;
  height: 100%;
}
</style>
