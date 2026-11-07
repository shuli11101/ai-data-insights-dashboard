<template>
  <div class="reports">
    <div class="reports__inner">
      <!-- 标题 + 汇总 + 新建入口 -->
      <header class="reports__head">
        <div class="reports__heading">
          <h1 class="reports__title">分析报告</h1>
          <p class="reports__summary">{{ summaryText }}</p>
        </div>

        <el-button type="primary" class="reports__create" @click="goCreate">新建分析</el-button>
      </header>

      <template v-if="isLoggedIn">
        <!-- 类型筛选 / 搜索 / 排序 -->
        <div class="filters">
          <div class="filters__tabs">
            <button v-for="tab in FILTER_TABS" :key="tab.value" type="button" class="filters__tab"
              :class="{ 'filters__tab--active': activeType === tab.value }" @click="activeType = tab.value">
              {{ tab.label }}
              <span class="filters__count">{{ counts[tab.value] }}</span>
            </button>
          </div>

          <div class="filters__tools">
            <el-input v-model="keyword" class="filters__search" placeholder="搜索岗位或公司" :prefix-icon="Search"
              clearable />
            <el-dropdown trigger="click" @command="handleSort">
              <span class="filters__sort">
                {{ currentSortLabel }}
                <el-icon class="filters__sort-icon">
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="option in SORT_OPTIONS" :key="option.value" :command="option.value">
                    {{ option.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 报告列表：按月份分组 -->
        <section v-loading="loading" class="sheet">
          <div v-if="error" class="sheet__state">
            <p class="sheet__state-title">{{ error }}</p>
            <el-button link type="primary" @click="loadReports">重新加载</el-button>
          </div>

          <div v-else-if="!groups.length" class="sheet__state">
            <p class="sheet__state-title">{{ keyword ? '没有匹配的报告' : '还没有分析报告' }}</p>
            <p class="sheet__state-hint">
              {{ keyword ? '换个关键词试试' : '去 AI 分析生成第一份报告吧' }}
            </p>
          </div>

          <template v-else>
            <div v-for="group in groups" :key="group.key" class="month">
              <div class="month__head">
                <span class="month__label">{{ group.label }}</span>
                <span class="month__count">{{ group.rows.length }} 份</span>
              </div>

              <div class="month__rows">
                <div v-for="row in group.rows" :key="row.id" class="row" @click="openRow(row)">
                  <div class="row__main">
                    <div class="row__type">
                      <span class="row__dot" :class="`row__dot--${row.type}`"></span>
                      <span>{{ TYPE_LABELS[row.type] }}</span>
                    </div>
                    <h2 class="row__title">{{ row.title }}</h2>
                    <p class="row__meta">{{ row.meta }}</p>
                  </div>

                  <div v-if="row.score !== null" class="row__score">
                    <strong class="row__score-value">{{ row.score }}%</strong>
                    <span class="row__score-label">匹配度</span>
                  </div>

                  <el-icon class="row__chevron">
                    <ArrowRight />
                  </el-icon>
                </div>
              </div>
            </div>
          </template>
        </section>

        <p class="reports__foot">报告基于当前简历与岗位信息生成，仅自己可见。</p>
      </template>

      <!-- 未登录 -->
      <div v-else class="reports__gate">
        <p class="reports__gate-title">登录后查看你的分析报告</p>
        <p class="reports__gate-desc">分析记录会同步到你的账号</p>
        <el-button type="primary" class="reports__gate-btn" @click="router.push('/login')">去登录</el-button>
      </div>
    </div>

    <!-- 岗位匹配：直接展示已保存的报告，不再重新分析 -->
    <AiMatchPanel v-if="activeMatch" v-model="matchVisible" :job-id="activeMatch.jobId"
      :job-title="activeMatch.title" :initial-content="activeMatch.content" :initial-score="activeMatch.score"
      mode="page" />

    <!-- JD 拆解：直接用 JD 分析组件展示已保存结果 -->
    <JdDescriptionPanel v-model="jdVisible" :title="jdTitle" :initial-content="jdContent" mode="page" />

    <!-- 技术栈分析：用分析报告组件展示已保存结果 -->
    <teleport to="body">
      <transition name="viewer-fade">
        <div v-if="skillVisible" class="viewer" @click.self="skillVisible = false">
          <section class="viewer__card" role="dialog" aria-modal="true" aria-label="技术栈分析报告">
            <header class="viewer__head">
              <div class="viewer__titles">
                <h3 class="viewer__title">技术栈分析报告</h3>
                <p v-if="skillTitle" class="viewer__sub">{{ skillTitle }}</p>
              </div>
              <el-button text circle class="viewer__close" :icon="Close" aria-label="关闭"
                @click="skillVisible = false" />
            </header>

            <div class="viewer__body">
              <AnalysisReport mode="1" :sections="skillSections" :loading="false" :refused="false" refuse-reason=""
                error="" />
            </div>
          </section>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowRight, Close, Search } from '@element-plus/icons-vue'

import AiMatchPanel from '@/components/ai-match-panel.vue'
import JdDescriptionPanel from '@/components/jd-description-panel.vue'
import AnalysisReport from '@/views/aiAnalyse/analysis-report.vue'

import { getConversation, listConversations, type ConversationSummary } from '@/api/conversation'
import { getMatchReport, getMatchReportList, type MatchReportListItem } from '@/api/server'
import { getToken } from '@/utils/token'
import { parseSections, sectionNumber } from '@/utils/aiText'

/** 报告类型：技术栈分析 / JD 拆解来自 AI 会话，岗位匹配来自已保存的匹配报告 */
type ReportType = 'skill' | 'jd' | 'match'
type FilterType = 'all' | ReportType

interface ReportRow {
  id: string
  type: ReportType
  title: string
  meta: string
  /** 没有匹配分的报告（如 JD 拆解）为 null */
  score: number | null
  /** 时间戳，用于排序与分组 */
  timestamp: number
  dateText: string
  /** 岗位匹配报告的岗位 ID */
  jobId?: number
  /** 岗位匹配报告的岗位名称，用于面板标题 */
  jobName?: string
  /** 岗位匹配报告正文，列表已带回，点开直接展示 */
  content?: string
  /** 技术栈 / JD 分析会话 ID */
  conversationId?: string
}

const TYPE_LABELS: Record<ReportType, string> = {
  skill: '技术栈分析',
  jd: 'JD 拆解',
  match: '岗位匹配',
}

const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'skill', label: '技术栈分析' },
  { value: 'jd', label: 'JD 拆解' },
  { value: 'match', label: '岗位匹配' },
]

const SORT_OPTIONS = [
  { value: 'time', label: '最近分析' },
  { value: 'score', label: '匹配度优先' },
] as const

/** 会话列表一次最多取 50 条，与后端上限保持一致 */
const CONVERSATION_LIMIT = 50

const router = useRouter()

const isLoggedIn = Boolean(getToken())
const loading = ref(false)
const error = ref('')
const rows = ref<ReportRow[]>([])

const activeType = ref<FilterType>('all')
const keyword = ref('')
const sortKey = ref<(typeof SORT_OPTIONS)[number]['value']>('time')

/** 岗位匹配报告面板：携带已保存的正文，打开即展示 */
const matchVisible = ref(false)
const activeMatch = ref<{ jobId: number; title: string; content: string; score: number } | null>(null)

/** 技术栈分析报告弹层 */
const skillVisible = ref(false)
const skillTitle = ref('')
const skillContent = ref('')
const skillSections = computed(() => parseSections(skillContent.value))

/** JD 拆解报告：复用 JD 分析组件 */
const jdVisible = ref(false)
const jdTitle = ref('')
const jdContent = ref('')

/** 后端时间可能是 "YYYY-MM-DD HH:mm:ss"，补成标准格式再解析 */
const parseTime = (time: string) => {
  const date = new Date(time.includes('T') ? time : time.replace(' ', 'T'))
  return date.getTime()
}

const formatDay = (time: string) => {
  const timestamp = parseTime(time)
  if (Number.isNaN(timestamp)) return ''

  const date = new Date(timestamp)
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

/** 技术栈分析的报告里带「匹配度评分」，JD 拆解没有分数 */
const conversationScore = (item: ConversationSummary) => {
  if (item.scene !== 'skill') return null

  const score = sectionNumber(parseSections(item.lastMessage || ''), '匹配度评分')
  return score ? Math.min(100, Math.round(score)) : null
}

const buildConversationRows = (list: ConversationSummary[]): ReportRow[] =>
  list
    .filter((item) => item.scene === 'skill' || item.scene === 'jd')
    .map((item) => {
      const type: ReportType = item.scene === 'skill' ? 'skill' : 'jd'
      const dateText = formatDay(item.updateTime)

      return {
        id: `c-${item.conversationId}`,
        type,
        title: item.title || `${TYPE_LABELS[type]}报告`,
        meta: [dateText, `${item.messageCount} 条消息`].filter(Boolean).join(' · '),
        score: conversationScore(item),
        timestamp: parseTime(item.updateTime),
        dateText,
        conversationId: item.conversationId,
      }
    })

const buildMatchRows = (list: MatchReportListItem[]): ReportRow[] =>
  list.map((item) => {
    const dateText = formatDay(item.saveTime)
    const extra = [item.location, item.skillCoverage > 0 ? `技能覆盖 ${item.skillCoverage}%` : '']
      .filter(Boolean)
      .join(' · ')

    return {
      id: `m-${item.reportId}`,
      type: 'match',
      title: [item.jobName, item.company].filter(Boolean).join(' · '),
      meta: [dateText, extra].filter(Boolean).join(' · '),
      score: Math.min(100, Math.max(0, Math.round(item.score))),
      timestamp: parseTime(item.saveTime),
      dateText,
      jobId: item.jobId,
      jobName: item.jobName,
      content: item.content,
    }
  })

/** 拉取 AI 分析会话与已保存的岗位匹配报告 */
const loadReports = async () => {
  if (!isLoggedIn || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const [reports, conversations] = await Promise.all([
      getMatchReportList(),
      listConversations(CONVERSATION_LIMIT),
    ])

    rows.value = [...buildConversationRows(conversations), ...buildMatchRows(reports.list)]
  } catch (e) {
    error.value = e instanceof Error ? e.message : '报告加载失败'
  } finally {
    loading.value = false
  }
}

/** 标题右侧汇总：总份数、平均匹配、最近更新 */
const summaryText = computed(() => {
  if (!rows.value.length) return '还没有分析记录'

  const scores = rows.value.map((row) => row.score).filter((score): score is number => score !== null)
  const average = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null
  const latest = rows.value.reduce(
    (max, row) => (Number.isNaN(row.timestamp) || row.timestamp < max ? max : row.timestamp),
    0,
  )

  return [
    `${rows.value.length} 份记录`,
    average === null ? '' : `平均匹配 ${average}%`,
    latest ? `最近更新 ${formatDay(new Date(latest).toISOString())}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
})

/** 各筛选类型下的数量 */
const counts = computed<Record<FilterType, number>>(() => ({
  all: rows.value.length,
  skill: rows.value.filter((row) => row.type === 'skill').length,
  jd: rows.value.filter((row) => row.type === 'jd').length,
  match: rows.value.filter((row) => row.type === 'match').length,
}))

const currentSortLabel = computed(
  () => SORT_OPTIONS.find((option) => option.value === sortKey.value)?.label ?? '最近分析',
)

/** 筛选 + 搜索 + 排序 */
const filteredRows = computed(() => {
  const search = keyword.value.trim().toLowerCase()

  return rows.value
    .filter((row) => {
      if (activeType.value !== 'all' && row.type !== activeType.value) return false
      if (!search) return true
      return `${row.title} ${row.meta}`.toLowerCase().includes(search)
    })
    .sort((a, b) => {
      if (sortKey.value === 'score') {
        const scoreA = a.score ?? -1
        const scoreB = b.score ?? -1
        if (scoreA !== scoreB) return scoreB - scoreA
      }
      const timeA = Number.isNaN(a.timestamp) ? 0 : a.timestamp
      const timeB = Number.isNaN(b.timestamp) ? 0 : b.timestamp
      return timeB - timeA
    })
})

interface ReportGroup {
  key: string
  label: string
  rows: ReportRow[]
}

/** 按月份分组，同组内保持排序结果 */
const groups = computed<ReportGroup[]>(() => {
  const map = new Map<string, ReportGroup>()
  const currentYear = new Date().getFullYear()

  for (const row of filteredRows.value) {
    if (Number.isNaN(row.timestamp)) continue

    const date = new Date(row.timestamp)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    let group = map.get(key)

    if (!group) {
      group = {
        key,
        label:
          date.getFullYear() === currentYear
            ? `${date.getMonth() + 1} 月`
            : `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`,
        rows: [],
      }
      map.set(key, group)
    }

    group.rows.push(row)
  }

  return [...map.values()]
})

const handleSort = (command: string | number | object) => {
  if (command === 'time' || command === 'score') sortKey.value = command
}

/** 点击报告：在当前页面打开对应组件，不跳转、不重新分析 */
const openRow = async (row: ReportRow) => {
  if (row.type === 'match') {
    if (!row.jobId) return

    // 正文已随列表返回，点开即展示；老数据缺正文时才回退请求一次
    let content = row.content?.trim() ?? ''
    if (!content) {
      try {
        content = (await getMatchReport(row.jobId)).content
      } catch {
        ElMessage.warning('报告已不存在，请刷新列表')
        return
      }
    }

    activeMatch.value = {
      jobId: row.jobId,
      title: row.jobName || row.title,
      content,
      score: row.score ?? 0,
    }
    matchVisible.value = true
    return
  }

  if (!row.conversationId) return

  try {
    // 读取会话里最后一条 AI 回复，直接交给对应组件展示
    const detail = await getConversation(row.conversationId)
    const lastReply = [...detail.messages].reverse().find((message) => message.role === 'assistant')

    if (!lastReply?.content) {
      ElMessage.warning('这条记录还没有生成分析结果')
      return
    }

    if (row.type === 'jd') {
      jdTitle.value = row.title
      jdContent.value = lastReply.content
      jdVisible.value = true
      return
    }

    skillTitle.value = row.title
    skillContent.value = lastReply.content
    skillVisible.value = true
  } catch {
    ElMessage.warning('分析记录加载失败')
  }
}

const goCreate = () => router.push({ path: '/ai-analyse', query: { mode: '1' } })

onMounted(loadReports)
</script>

<style scoped lang="scss">
.reports {
  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #17252b;
  background: #f4f8f7;

  .reports__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    padding: 40px 40px 60px;
    margin: 0 auto;
  }

  .reports__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }

  .reports__title {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -1px;
    color: #17252b;
  }

  .reports__summary {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #65747c;
  }

  .reports__create {
    flex-shrink: 0;
    height: 40px;
    padding: 0 24px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 10px;

    --el-button-bg-color: #007c77;
    --el-button-border-color: #007c77;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-active-bg-color: #005f5b;
    --el-button-active-border-color: #005f5b;
  }

  // ---------- 筛选栏 ----------
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-end;
    margin-top: 28px;
  }

  .filters__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
  }

  .filters__tab {
    padding: 0 0 10px;
    margin: 0;
    font: inherit;
    font-size: 14px;
    line-height: 1.2;
    color: #65747c;
    cursor: pointer;
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    transition:
      color 0.18s ease,
      border-color 0.18s ease;
  }

  .filters__tab--active {
    font-weight: 600;
    color: #007c77;
    border-bottom-color: #007c77;

    .filters__count {
      color: #4f6068;
    }
  }

  .filters__count {
    margin-left: 5px;
    font-size: 11px;
    font-weight: 500;
    color: #a1acb3;
  }

  .filters__tools {
    display: flex;
    gap: 18px;
    align-items: center;
    margin-left: auto;
  }

  .filters__search {
    width: 200px;

    :deep(.el-input__wrapper) {
      height: 36px;
      border-radius: 9px;
      box-shadow: 0 0 0 1px #d8e2e3 inset;
    }

    :deep(.el-input__inner) {
      font-size: 12px;
    }
  }

  .filters__sort {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: #65747c;
    cursor: pointer;
    user-select: none;
  }

  .filters__sort-icon {
    color: #8a979e;
  }

  // ---------- 报告列表 ----------
  .sheet {
    min-height: 240px;
    padding: 22px 32px 12px;
    margin-top: 26px;
    background: #ffffff;
    border: 1px solid #dde8e6;
    border-radius: 18px;
  }

  .sheet__state {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    text-align: center;
  }

  .sheet__state-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #3d4b54;
  }

  .sheet__state-hint {
    margin: 0;
    font-size: 12px;
    color: #8a979e;
  }

  .month + .month {
    margin-top: 18px;
  }

  .month__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 4px;
  }

  .month__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: #78868f;
  }

  .month__count {
    font-size: 10.5px;
    color: #a1acb3;
  }

  .row {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 18px 12px;
    margin: 0 -12px;
    cursor: pointer;
    border-radius: 10px;
    transition: background-color 0.18s ease;

    &:hover {
      background: #f7fbfa;
    }
  }

  .month__rows .row:not(:last-child) {
    border-bottom: 1px solid #edf2f2;
  }

  .row__main {
    flex: 1;
    min-width: 0;
  }

  .row__type {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 10.5px;
    letter-spacing: 0.3px;
    color: #65747c;
  }

  .row__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .row__dot--skill {
    background: #007c77;
  }

  .row__dot--jd {
    background: #00bebd;
  }

  .row__dot--match {
    background: #17252b;
  }

  .row__title {
    margin: 8px 0 0;
    overflow: hidden;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.2px;
    color: #17252b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row__meta {
    margin: 5px 0 0;
    overflow: hidden;
    font-size: 11.5px;
    line-height: 1.4;
    color: #8a979e;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row__score {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-end;
  }

  .row__score-value {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.8px;
    color: #007c77;
  }

  .row__score-label {
    margin-top: 3px;
    font-size: 9.5px;
    color: #9aa6ac;
  }

  .row__chevron {
    flex-shrink: 0;
    color: #b7c4c4;
  }

  .reports__foot {
    margin: 16px 0 0;
    font-size: 10.5px;
    color: #8a979e;
  }

  // ---------- 未登录 ----------
  .reports__gate {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    margin-top: 32px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #dde8e6;
    border-radius: 18px;
  }

  .reports__gate-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #17252b;
  }

  .reports__gate-desc {
    margin: 0;
    font-size: 12px;
    color: #8a979e;
  }

  .reports__gate-btn {
    margin-top: 10px;
    border-radius: 10px;

    --el-button-bg-color: #007c77;
    --el-button-border-color: #007c77;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
  }

  // ---------- 响应式 ----------
  @media (max-width: 1023.98px) {
    .reports__inner {
      padding: 32px 20px 48px;
    }

    .reports__title {
      font-size: 28px;
    }

    .filters__tools {
      width: 100%;
      margin-left: 0;
    }

    .filters__search {
      flex: 1;
      width: auto;
    }

    .sheet {
      padding: 18px 18px 10px;
      border-radius: 14px;
    }

    .row {
      gap: 12px;
    }

    .row__score-value {
      font-size: 22px;
    }
  }

  @media (max-width: 640px) {
    .reports__inner {
      padding: 24px 16px 40px;
    }

    .reports__head {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .reports__title {
      font-size: 24px;
    }

    .filters {
      gap: 14px;
    }

    .filters__tabs {
      gap: 18px;
    }

    .filters__tab {
      font-size: 13px;
    }

    .row__title {
      font-size: 15px;
    }
  }
}

// ---------- 技术栈分析报告弹层 ----------
.viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: rgba(11, 60, 57, 0.38);
  backdrop-filter: blur(4px);

  .viewer__card {
    display: flex;
    flex-direction: column;
    width: min(880px, 100%);
    max-height: 86vh;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #dde8e6;
    border-radius: 18px;
    box-shadow: 0 18px 48px rgba(11, 60, 57, 0.14);
  }

  .viewer__head {
    display: flex;
    flex-shrink: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px 12px;
    background: linear-gradient(180deg, #eef9f7 0%, #ffffff 100%);
    border-bottom: 1px solid #edf2f2;
  }

  .viewer__titles {
    min-width: 0;
  }

  .viewer__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: #17252b;
  }

  .viewer__sub {
    margin: 4px 0 0;
    overflow: hidden;
    font-size: 11.5px;
    color: #65747c;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .viewer__close {
    flex-shrink: 0;
    color: #8a979e;

    &:hover {
      color: #007c77;
    }
  }

  .viewer__body {
    flex: 1;
    min-height: 240px;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  // 复用报告组件的排版，去掉它自带的面包屑头部
  .viewer__body :deep(.report) {
    box-sizing: border-box;
    width: 100%;
    padding: 4px 20px 16px;
  }

  .viewer__body :deep(.report__head) {
    display: none;
  }

  .viewer__body :deep(.report__title) {
    font-size: 20px;
  }

  @media (max-width: 640px) {
    padding: 12px;

    .viewer__body :deep(.report) {
      padding: 4px 14px 16px;
    }

    .viewer__body :deep(.report__body) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}
</style>
