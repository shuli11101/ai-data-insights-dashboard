<template>
  <div class="home">
    <!-- 筛选区 -->
    <section class="filter">
      <div class="filter__grid">
        <div v-for="item in filterItems" :key="item.prop" class="filter__item">
          <span class="filter__label">{{ item.label }}</span>
          <el-select v-model="query[item.prop]" placeholder="请选择" class="filter__select">
            <div v-for="option in item.options" :key="option">
              <el-option :label="option" :value="option" />
            </div>
          </el-select>
        </div>

        <!-- 查询按钮 -->
        <div class="filter__actions">
          <el-button type="primary" :icon="Search">查询</el-button>
          <el-button class="filter__reset" :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <!-- 图表区 -->
    <section class="charts">
      <!-- 薪资分布：柱状图 -->
      <ChartCard :title="salaryChart.title" :subtitle="salaryChart.subtitle">
        <div ref="salaryChartEl" class="charts__canvas"></div>
      </ChartCard>

      <!-- 技术栈热度：条形图 -->
      <ChartCard :title="stackChart.title" :subtitle="stackChart.subtitle">
        <div ref="stackChartEl" class="charts__canvas"></div>
      </ChartCard>

      <!-- 深圳各区岗位数量：环形图 -->
      <ChartCard :title="districtChart.title" :subtitle="districtChart.subtitle">
        <div ref="districtChartEl" class="charts__canvas"></div>
      </ChartCard>

      <!-- 经验与平均薪资：面积折线图 -->
      <ChartCard :title="experienceChart.title" :subtitle="experienceChart.subtitle">
        <div ref="experienceChartEl" class="charts__canvas"></div>
      </ChartCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'

import ChartCard from '@/components/chart-card.vue'
import { useChart } from '@/composables/useChart'

// 筛选项配置
interface FilterItem {
  prop: 'city' | 'experience' | 'salary' | 'keyword'
  label: string
  defaultLabel: string,
  options?: string[]
}


// 筛选列表
const cities = ref<string[]>(['全部城市', '北京', '上海', '广州', '深圳'])
const experiences = ref<string[]>(['不限经验', '1年以下', '1-3年', '3-5年', '5年以上'])
const salaries = ref<string[]>(['不限薪资', '100k以下', '100k-200k', '200k以上'])
const keywords = ref<string[]>(['全部技术', 'AI', '数据', '分析', '可视化'])

/** 筛选项配置，各选项列表待接入接口后补充 */
const filterItems: FilterItem[] = [
  { prop: 'city', label: '城市', defaultLabel: '全部城市', options: cities.value },
  { prop: 'experience', label: '工作经验', defaultLabel: '不限经验', options: experiences.value },
  { prop: 'salary', label: '薪资区间', defaultLabel: '不限薪资', options: salaries.value },
  { prop: 'keyword', label: '技术关键词', defaultLabel: '全部技术', options: keywords.value },
]


// 查询数据
const query = reactive<Record<FilterItem['prop'], string>>({
  city: '',
  experience: '',
  salary: '',
  keyword: '',
})

// 薪资分布：柱状图（静态数据，待接入接口）
const salaryChart = {
  title: '薪资分布',
  subtitle: '岗位薪资区间分布（单位：个）',
  categories: ['5-10K', '10-15K', '15-20K', '20-30K', '30-40K', '40K+'],
  values: [42, 85, 128, 93, 57, 20],
  colors: ['#8cc4f4', '#4e9bf0', '#5b8ae6', '#a8cef5', '#c6dcf8', '#c6cbd2'],
}

// 技术栈热度：条形图（静态数据，待接入接口）
const stackChart = {
  title: '技术栈热度',
  subtitle: '热门技术词条提及次数',
  categories: [
    'Python',
    '大模型',
    'LLM',
    'PyTorch',
    'LangChain',
    '计算机视觉',
    'NLP',
    'RAG',
    '数据工程',
    'TensorFlow',
  ],
  values: [95, 91, 86, 82, 77, 71, 66, 63, 61, 58],
}

// 深圳各区岗位数量：环形图（静态数据，待接入接口）
const districtChart = {
  title: '深圳各区岗位数量',
  subtitle: '各行政区招聘岗位占比',
  colors: ['#4e9bf0', '#4c6fe0', '#8cc4f4', '#17bca8', '#f5a623', '#bfd9f5', '#c6cbd2'],
  data: [
    { name: '南山区', value: 42 },
    { name: '福田区', value: 25 },
    { name: '龙岗区', value: 12 },
    { name: '宝安区', value: 8 },
    { name: '龙华区', value: 7 },
    { name: '罗湖区', value: 4 },
    { name: '其他', value: 2 },
  ],
}

// 经验与平均薪资：面积折线图（静态数据，待接入接口）
const experienceChart = {
  title: '经验与平均薪资',
  subtitle: '不同经验年限平均月薪（k）',
  categories: ['应届', '1-3年', '3-5年', '5-10年', '10年+'],
  values: [11, 18, 26, 38, 52],
}

// 薪资分布
const salaryChartEl = useChart({
  color: salaryChart.colors,
  grid: { top: 8, right: 8, bottom: 4, left: 0, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: salaryChart.categories,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11, rotate: 40 },
  },
  yAxis: {
    type: 'value',
    max: 140,
    interval: 20,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: '#eef2f6' } },
  },
  series: [
    {
      type: 'bar',
      colorBy: 'data',
      barWidth: '55%',
      itemStyle: { borderRadius: [2, 2, 0, 0] },
      data: salaryChart.values,
    },
  ],
})

// 技术栈热度
const stackChartEl = useChart({
  grid: { top: 8, right: 8, bottom: 4, left: 0, containLabel: true },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'value',
    max: 100,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: '#eef2f6' } },
  },
  yAxis: {
    type: 'category',
    data: stackChart.categories,
    // 让第一个（Python）显示在最上方
    inverse: true,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 },
  },
  series: [
    {
      type: 'bar',
      barWidth: '55%',
      itemStyle: { color: '#4e9bf0', borderRadius: [0, 5, 5, 0] },
      data: stackChart.values,
    },
  ],
})

// 深圳各区岗位数量
// 图例的三档配置：容器够宽 / 变窄缩小 / 极窄不渲染
const districtLegend = {
  wide: {
    show: true,
    itemWidth: 9,
    itemHeight: 9,
    right: 30,
    itemGap: 20,
    textStyle: { color: '#64748b', fontSize: 16 },
  },
  narrow: {
    show: true,
    itemWidth: 8,
    itemHeight: 8,
    right: 10,
    itemGap: 20,
    textStyle: { color: '#64748b', fontSize: 11 },
  },
  hidden: {
    show: false,
  },
}

// 饼图几何：有图例时左移让位，无图例时居中放大
const districtPie = {
  withLegend: { radius: ['50%', '78%'], center: ['36%', '50%'] },
  noLegend: { radius: ['55%', '85%'], center: ['50%', '50%'] },
}

const districtChartEl = useChart({
  baseOption: {
    color: districtChart.colors,
    tooltip: { trigger: 'item', formatter: '{b}：{d}%' },
    legend: { orient: 'vertical', top: 'center', icon: 'roundRect', ...districtLegend.wide },
    series: [
      {
        type: 'pie',
        label: { show: false },
        labelLine: { show: false },
        // 扇区之间留白边
        itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
        data: districtChart.data,
        ...districtPie.withLegend,
      },
    ],
  },
  // 容器变窄（栅格列数变化）时同步调整图例
  // 注意 1：media 的 query 判定的是「图表容器」的尺寸，不是窗口尺寸，所以卡片变窄就会命中。
  // 注意 2：ECharts 只会「叠加」命中的 media option，query 失效时不会自动回滚，
  //        因此每一档都要把其它档改过的字段写全，否则多档之间会互相粘住。
  media: [
    {
      query: { maxWidth: 360 },
      option: {
        legend: districtLegend.narrow,
        series: [districtPie.withLegend],
      },
    },
    {
      query: { maxWidth: 320 },
      option: {
        legend: districtLegend.hidden,
        series: [districtPie.noLegend],
      },
    },
    // 不写 query 的这一项是 mediaDefault：所有 query 都不命中（容器够宽）时生效，
    // 用来把上面两档改过的配置恢复回基准值，否则窗口变宽后图例不会回来
    {
      option: {
        legend: districtLegend.wide,
        series: [districtPie.withLegend],
      },
    },
  ],
})

// 经验与平均薪资：面积折线图
const experienceChartEl = useChart({
  grid: { top: 8, right: 12, bottom: 4, left: 0, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    // 首尾点贴边不好看，留一点内边距
    boundaryGap: false,
    data: experienceChart.categories,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    min: 10,
    max: 55,
    interval: 5,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}k' },
    splitLine: { lineStyle: { color: '#eef2f6' } },
  },
  series: [
    {
      type: 'line',
      color: '#4e9bf0',
      symbol: 'circle',
      symbolSize: 9,
      lineStyle: { width: 3 },
      itemStyle: { color: '#4e9bf0' },
      // 线下面积：自上而下由深到浅的蓝色渐变
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(78, 155, 240, 0.35)' },
            { offset: 1, color: 'rgba(78, 155, 240, 0.06)' },
          ],
        },
      },
      data: experienceChart.values,
    },
  ],
})

// 重置筛选条件
const handleReset = () => {
  filterItems.forEach((item) => {
    query[item.prop] = ''
  })
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.filter {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 1px 3px 0 rgba(15, 23, 42, 0.03),
    0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

/* 基准（≥1200px）：6 列，4 个筛选项各占 1 列，按钮组占 2 列 */
.filter__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  align-items: end;
}

.filter__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.filter__label {
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  line-height: 16px;
  color: #64748b;
}

.filter__select {
  --el-border-color: #e5e7eb;
  --el-input-text-color: #1f2937;
  --el-select-input-color: #64748b;
  --el-select-input-font-size: 16px;
}

.filter__select :deep(.el-select__wrapper) {
  min-height: 36px;
  padding: 0 11px 0 12px;
  font-size: 14px;
}

.filter__actions {
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 36px;
}

.filter__actions :deep(.el-button) {
  height: 36px;
  padding: 0 16px;
  width: 200px;
}

/* el-button 相邻按钮自带 12px margin，避免与容器 gap 叠加 */
.filter__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.filter__reset {
  --el-button-text-color: #1f2937;
  --el-button-border-color: #e5e7eb;
  --el-button-hover-text-color: #1f2937;
  --el-button-hover-border-color: #e5e7eb;
  --el-button-hover-bg-color: #f9fafb;
  --el-button-active-text-color: #1f2937;
  --el-button-active-border-color: #e5e7eb;
}

/* 图表区：基准（≥1200px）4 列 */
.charts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

/* ECharts 容器撑满卡片图表区（288px），init 依赖确定尺寸 */
.charts__canvas {
  width: 100%;
  height: 100%;
}

/* 中等屏幕：4 列，按钮组换行并靠右 */
@media (max-width: 1199.98px) {
  .filter__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .filter__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 平板：2 列 */
@media (max-width: 991.98px) {
  .filter__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 手机端：单列堆叠，按钮等宽铺满 */
@media (max-width: 599.98px) {
  .home {
    padding: 12px;
  }

  .filter {
    padding: 16px;
  }

  .filter__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .charts {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .filter__actions {
    height: auto;
  }

  .filter__actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
