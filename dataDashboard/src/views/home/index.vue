<template>
  <div class="home">

    <!-- 用户基础信息dial（服务端按 IP 判断：已填写过则不再展示） -->
    <Survey v-if="showSurvey" />

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


    <!-- 筛选区 -->
    <section class="filter">
      <div class="filter__grid">
        <div v-for="item in filterItems" :key="item.prop" class="filter__item">
          <span class="filter__label">{{ item.label }}</span>
          <el-select v-model="query[item.prop]" placeholder="请选择" class="filter__select">
            <div v-for="option in item.options" :key="option.value">
              <el-option :label="option.label" :value="option.value" />
            </div>
          </el-select>
        </div>

        <!-- 查询按钮 -->
        <div class="filter__actions">
          <el-button @click="handleQuery" type="primary" class="filter__query" :icon="Search">查询</el-button>
          <el-button class="filter__reset" :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <!-- 岗位数据表格 -->
    <!-- 标题 -->
    <section class="jobs">
      <div class="jobs__head">
        <h3 class="jobs__title">
          <el-icon class="jobs__title-icon">
            <Tickets />
          </el-icon>
          <span>岗位数据</span>
        </h3>
        <el-button :icon="Refresh">刷新</el-button>
      </div>

      <!-- 岗位列表 - 暂时使用slice进行分页 -->
      <el-table :data="jobList" class="jobs__table" @row-click="searchJobDetail">
        <el-table-column prop="job_name" label="岗位名称" min-width="80" />
        <el-table-column align="center" prop="company" label="公司" />
        <el-table-column align="center" label="薪资（单位：K）">
          <template #default="{ row }">{{ row.salary_min }}-{{ row.salary_max }}</template>
        </el-table-column>
        <el-table-column align="center" prop="experience" label="经验" />
        <el-table-column label="技能标签">
          <template #default="{ row }">
            <el-tag v-for="tag in row.skill_tags" :key="tag" class="jobs__tag">{{ tag }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="jobs__foot">
        <el-pagination v-model:current-page="jobPagination.page" v-model:page-size="jobPagination.size"
          :page-sizes="[5, 10, 20, 50]" :total="jobPagination.total" :pager-count="5"
          layout="total, sizes, ->, prev, pager, next" prev-text="<" next-text=">" />
      </div>
    </section>

    <!-- AI 智能解读浮层（默认显示，后续由表格行点击控制显隐与位置） -->
    <AiInterpretCard v-model="interpretVisible" :left="interpretX" :top="interpretY" :searchJobData="searchJobData" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { Refresh, Search, Tickets } from '@element-plus/icons-vue'

import AiInterpretCard from '@/components/ai-interpret-card.vue'
import ChartCard from '@/components/chart-card.vue'
import Survey from '@/views/survey/index.vue'
import { useChart } from '@/composables/useChart'
import { getJobList, getSalaryRange, getSkillTags, getDistrict, getExperienceSalary, getCity, getKeywords, getClientIp, getSurveyStatus } from '@/api/server'

// 筛选项配置
interface FilterItem {
  prop: 'city' | 'experience' | 'salary' | 'keyword'
  label: string
  defaultLabel: string,
  options: { label: string, value: string }[],
}


// 筛选列表
const cities = ref<{ label: string, value: string }[]>([])
const experiences = ref<{ label: string, value: string }[]>([
  {
    label: '不限经验',
    value: '',
  },
  {
    label: '应届',
    value: '应届',
  },
  {
    label: '1年以下',
    value: '0-1',
  },
  {
    label: '1-3年',
    value: '1-3',
  },
  {
    label: '3-5年',
    value: '3-5',
  },
  {
    label: '5年以上',
    value: '5-',
  }
])
const salaries = ref<{ label: string, value: string }[]>([
  {
    label: '不限薪资',
    value: '',
  },
  {
    label: '5K以下',
    value: '0-5',
  },
  {
    label: '5K-10K',
    value: '5-10',
  },
  {
    label: '10K-15K',
    value: '10-15',
  },
  {
    label: '15K-20K',
    value: '15-20',
  },
  {
    label: '20K-25K',
    value: '20-25',
  },
  {
    label: '25K-30K',
    value: '25-30',
  },
  {
    label: '30K-35K',
    value: '30-35',
  },
  {
    label: '35K-40K',
    value: '35-40',
  },
  {
    label: '40K以上',
    value: '40-',
  },
])
const keywords = ref<{ label: string, value: string }[]>([])

/** 筛选项配置，各选项列表待接入接口后补充 */
const filterItems = computed<FilterItem[]>(() => [
  { prop: 'city', label: '城市', defaultLabel: '全部城市', options: cities.value },
  { prop: 'experience', label: '工作经验', defaultLabel: '不限经验', options: experiences.value },
  { prop: 'salary', label: '薪资区间（单位：K/月）', defaultLabel: '不限薪资', options: salaries.value },
  { prop: 'keyword', label: '技术关键词', defaultLabel: '全部技术', options: keywords.value },
])

// 查询数据
interface JobQuery {
  city: string
  experience: string
  salary: string
  keyword: string
}

const query = reactive<JobQuery>({
  city: '',
  experience: '',
  salary: '',
  keyword: '',
})

// 薪资分布：柱状图（静态数据，待接入接口）
const salaryData = ref<number[]>([])

const salaryChart = {
  title: '薪资分布',
  subtitle: '岗位薪资区间分布（单位：个）',
  categories: ['0-10K', '10-15K', '15-20K', '20-25K', '25-30K', '30-35K', '35-40K', '40K+'],
  values: salaryData.value,
  colors: ['#8cc4f4', '#4e9bf0', '#5b8ae6', '#a8cef5', '#c6dcf8', '#c6cbd2'],
}


// 技术栈热度：条形图
const skillTags = ref<{ skillName: string, hotCount: number }[]>([])
const stackChart = {
  title: '技术栈热度',
  subtitle: '热门技术词条提及次数',
}

// 各地方岗位数量：环形图
const jobDistrict = ref<{ region: string, jobRatio: number }[]>([])
const districtChart = {
  title: '地方岗位数量',
  subtitle: '各行政区招聘岗位占比',
  colors: ['#4e9bf0', '#4c6fe0', '#8cc4f4', '#17bca8', '#f5a623', '#bfd9f5', '#c6cbd2'],
}

// 经验与平均薪资：面积折线图
const expSalary = ref<{ experience: string, avgSalary: number }[]>([])

const experienceChart = {
  title: '经验与平均薪资',
  subtitle: '不同经验年限平均月薪（k）',
}

// 薪资分布
const salaryChartEl = useChart(() => ({
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
    max: 10,
    interval: 2,
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
      data: salaryData.value,
    },
  ],
}))

// 技术栈热度
const stackChartEl = useChart(() => {
  const counts = skillTags.value.map(item => item.hotCount)
  // 连续渐变需要上下界，取数据最大值；空数据时兜底为 1，避免 min === max
  const maxCount = counts.length ? Math.max(...counts) : 1

  return {
    grid: { top: 8, right: 8, bottom: 4, left: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    // 颜色随数值连续过渡：值越小越浅，值越大越深
    visualMap: {
      type: 'continuous',
      show: false,
      min: 0,
      max: maxCount,
      inRange: { color: ['#c6dcf8', '#8cc4f4', '#4e9bf0'] },
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: '#eef2f6' } },
    },
    yAxis: {
      type: 'category',
      data: skillTags.value.map(item => item.skillName),
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
        // 颜色交给 visualMap，这里不再写死单色
        itemStyle: { borderRadius: [0, 5, 5, 0] },
        data: counts,
      },
    ],
  }
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

const districtChartEl = useChart(() => ({
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
        // 饼图要求 { name, value }，这里把接口的 region / jobRatio 映射过去
        data: jobDistrict.value.map(item => ({ name: item.region, value: item.jobRatio })),
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
}))

// 经验与平均薪资：面积折线图
const experienceChartEl = useChart(() => ({
  grid: { top: 8, right: 12, bottom: 4, left: 0, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    // 首尾点贴边不好看，留一点内边距
    boundaryGap: false,
    data: expSalary.value.map(item => item.experience),
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
      data: expSalary.value.map(item => item.avgSalary),
    },
  ],
}))



/** 岗位数据表格行 */
interface JobRow {
  id: number
  job_name: string
  company: string
  salary_min: number
  salary_max: number
  experience: string
  skill_tags: string[]
}

// 岗位数据列表（静态数据，待接入接口）
const jobList = ref<JobRow[]>([])

// 分页状态（总数为静态值，待接入接口后由返回结果驱动）
const jobPagination = reactive({ page: 1, size: 5, total: 0 })

// AI 智能解读浮层
const interpretVisible = ref(false)
const searchJobData = ref<JobRow>({
  id: 0,
  company: '',
  salary_min: 0,
  salary_max: 0,
  job_name: '',
  experience: '',
  skill_tags: [],
})
// 调整窗口出现位置
const CARD_HEIGHT = 420 // 卡片高度
const CARD_WIDTH = 420 // 卡片宽度
const CARD_GAP = 12 // 卡片间距

// 默认鼠标位置
const interpretX = ref(0)
const interpretY = ref(0)
const searchJobDetail = async (_row: JobRow, _column: unknown, event: MouseEvent) => {
  // 数据赋值
  interpretVisible.value = true
  searchJobData.value = _row
  console.log(searchJobData.value)

  // 计算鼠标位置
  interpretX.value =
    event.clientX + CARD_GAP + CARD_WIDTH > window.innerWidth ? event.clientX - CARD_WIDTH - CARD_GAP : event.clientX + CARD_GAP // 翻到鼠标右侧
  interpretY.value =
    event.clientY + CARD_GAP + CARD_HEIGHT > window.innerHeight ? event.clientY - CARD_HEIGHT - CARD_GAP : event.clientY + CARD_GAP // 翻到鼠标下方
  // 显示浮层
  interpretVisible.value = true
}

//  查询函数
const handleQuery = () => {
  console.log('筛选条件:', query)
  jobPagination.page = 1
  getJob(query)
}

// 重置筛选条件
const handleReset = () => {
  filterItems.value.forEach((item) => {
    query[item.prop] = ''
  })
  jobPagination.page = 1
  getJob(query)
}



// 是否展示问卷弹窗：由服务端按请求 IP 判断该 IP 是否已填写过问卷
const showSurvey = ref(false)
const checkSurveyStatus = async () => {
  const res = await getSurveyStatus()
  console.log('问卷状态:', res)
  showSurvey.value = !res.filled
}


// 页面渲染时
onMounted(() => {

  // 按 IP 判断是否需要填写问卷
  checkSurveyStatus()

  getJob(query)
  getSalary()
  getSkills()
  getJobDistrict()
  getExpSalary()

  // 获取查询时的数据列表
  getCity().then(res => {
    cities.value = res.map(item => {
      return {
        label: item.district,
        value: item.district,
      }
    })
    cities.value.unshift({
      label: '不限城市',
      value: '',
    })
    // console.log(cities.value)
  })

  // 获取技术关键词
  getKeywords().then(res => {
    keywords.value = res.map(item => {
      return {
        label: item.skill,
        value: item.skill,
      }
    })
    keywords.value.unshift({
      label: '不限关键词',
      value: '',
    })
    // console.log(keywords.value)
  })
})

//  获取岗位数据
const getJob = async (query: JobQuery) => {
  try {
    const res = await getJobList({ page: jobPagination.page, size: jobPagination.size, ...query })
    jobList.value = res.list
    jobPagination.total = res.total
    // console.log(jobList.value)
  } catch (error) {
    console.log("获取岗位数据失败：", error)
  }
}

// 获取薪资分布数据
const getSalary = async () => {
  try {
    const res = await getSalaryRange()
    salaryData.value = res.reduce((acc, cur) => {
      acc.push(cur.jobCount)
      return acc
    }, [] as number[])
    // console.log(salaryData.value)
  } catch (error) {
    console.log("获取薪资分布数据失败：", error)
  }
}

// 获取技术栈热度
const getSkills = async () => {
  try {
    const res = await getSkillTags()
    skillTags.value = res.map(item => {
      return {
        skillName: item.skill_tag,
        hotCount: item.hot_count,
      }
    })
    // console.log(skillTags.value)
  } catch (error) {
    console.log("获取技术栈热度失败：", error)
  }
}

// 获取地方岗位数量数据
const getJobDistrict = async () => {
  try {
    const res = await getDistrict()
    jobDistrict.value = res.map(item => {
      return {
        region: item.area_name,
        jobRatio: item.job_count,
      }
    })
    // console.log(jobDistrict.value)
  } catch (error) {
    console.log("获取地方岗位数量数据失败：", error)
  }
}

// 工作经验与平均薪资
const getExpSalary = async () => {
  try {
    const res = await getExperienceSalary()
    expSalary.value = res.map(item => {
      return {
        experience: item.experience,
        avgSalary: item.avg_salary,
      }
    })
    // console.log(expSalary.value)
  } catch (error) {
    console.log("获取工作经验对应平均薪资数据失败：", error)
  }
}



// 页码或每页条数变化（换页）时重新请求
watch(() => [jobPagination.page, jobPagination.size], () => {
  getJob(query)
},
)
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

.filter__query {
  --el-button-hover-bg-color: #3d74ff;
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

/* 岗位数据表格 */
.jobs {
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 1px 3px 0 rgba(15, 23, 42, 0.03),
    0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

.jobs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
}

.jobs__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: #1f2937;
}

.jobs__title-icon {
  font-size: 18px;
  color: #4e9bf0;
}

.jobs__table {
  --el-table-border-color: #f1f5f9;
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #64748b;
  --el-table-text-color: #1f2937;
  --el-table-row-hover-bg-color: #f8fafc;
}

/* 表头不加粗，与设计稿一致（覆盖 Element Plus 默认的 600） */
.jobs__table :deep(.el-table__header th.el-table__cell) {
  font-weight: 400;
}

/* 行高对齐设计稿（约 46px） */
.jobs__table :deep(.el-table__cell) {
  padding: 12px 0;
}

.jobs__tag {
  --el-tag-bg-color: #eaf3fe;
  --el-tag-border-color: transparent;
  --el-tag-text-color: #4e9bf0;

  margin-right: 6px;
}

.jobs__tag:last-child {
  margin-right: 0;
}

.jobs__foot {
  padding-top: 16px;
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

/* table 数据中的技能标签tag 增加上下gap */
.jobs__tag {
  margin-bottom: 4px;
}

/* 手机端：单列堆叠，按钮等宽铺满 */
@media (max-width: 1023.98px) {
  .home {
    padding: 12px;
  }

  .filter {
    padding: 16px;
  }

  .jobs {
    padding: 16px;
  }

  /* 手机端分页一行放不下，允许换行 */
  .jobs__foot :deep(.el-pagination) {
    flex-wrap: wrap;
    row-gap: 8px;
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
