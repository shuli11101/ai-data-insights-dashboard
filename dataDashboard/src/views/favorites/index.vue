<template>
  <div class="favorites">
    <div class="favorites__inner">
      <!-- 标题 + 汇总 + 去职位广场 -->
      <header class="favorites__head">
        <div class="favorites__heading">
          <h1 class="favorites__title">收藏职位</h1>
          <p class="favorites__summary">{{ summaryText }}</p>
        </div>

        <el-button class="favorites__create" @click="router.push('/jobs')">去职位广场</el-button>
      </header>

      <template v-if="isLoggedIn">
        <!-- 城市筛选 / 搜索 / 排序 -->
        <div class="filters">
          <div class="filters__tabs">
            <button v-for="tab in cityTabs" :key="tab.value" type="button" class="filters__tab"
              :class="{ 'filters__tab--active': activeCity === tab.value }" @click="handleCityClick(tab.value)">
              {{ tab.label }}
              <span class="filters__count">{{ tab.count }}</span>
            </button>
          </div>

          <div class="filters__tools">
            <el-input v-model="keyword" class="filters__search" placeholder="搜索收藏职位" :prefix-icon="Search" clearable />
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

        <!-- 收藏列表 -->
        <section v-loading="loading" class="sheet">
          <div v-if="error" class="sheet__state">
            <p class="sheet__state-title">{{ error }}</p>
            <el-button link type="primary" @click="loadFavorites">重新加载</el-button>
          </div>

          <div v-else-if="!pagedRows.length" class="sheet__state">
            <p class="sheet__state-title">{{ keyword ? '没有匹配的收藏' : '还没有收藏职位' }}</p>
            <p class="sheet__state-hint">
              {{ keyword ? '换个关键词试试' : '去职位广场看看合适的岗位吧' }}
            </p>
            <el-button v-if="!keyword && !rows.length" link type="primary" @click="router.push('/jobs')">
              去职位广场
            </el-button>
          </div>

          <template v-else>
            <div v-for="row in pagedRows" :key="row.id" class="row" @click="openJob(row)">
              <div class="row__main">
                <h2 class="row__title">{{ row.jobName }}</h2>
                <p class="row__meta">{{ row.meta }}</p>
                <p v-if="row.tags.length" class="row__tags">{{ row.tags.join('　') }}</p>
              </div>

              <div class="row__side">
                <span class="row__salary">{{ row.salary }}</span>
                <span v-if="row.score !== null" class="row__match">
                  <b>{{ row.score }}%</b>
                  <span class="row__match-label"> 匹配</span>
                </span>
                <span class="row__time">{{ row.favoriteText }}</span>
              </div>

              <!-- 已收藏：点击取消 -->
              <button type="button" class="row__star" title="取消收藏" @click.stop="unfavorite(row)">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5V21l-6-4.2L6 21V3.5Z" />
                </svg>
              </button>

              <el-icon class="row__chevron">
                <ArrowRight />
              </el-icon>
            </div>
          </template>
        </section>

        <footer class="favorites__foot">
          <span class="favorites__note">已收藏的职位若已下线，会自动标记为失效。</span>

          <el-pagination v-if="filteredRows.length > PAGE_SIZE" v-model:current-page="page" small
            layout="prev, pager, next" :page-size="PAGE_SIZE" :total="filteredRows.length" />
        </footer>
      </template>

      <!-- 未登录 -->
      <div v-else class="favorites__gate">
        <p class="favorites__gate-title">登录后查看收藏的职位</p>
        <p class="favorites__gate-desc">收藏记录会同步到你的账号</p>
        <el-button type="primary" class="favorites__gate-btn" @click="router.push('/login')">去登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowRight, Search } from '@element-plus/icons-vue'

import {
  getFavoriteList,
  getMatchReportList,
  removeFavorite,
  type FavoriteJobItem,
} from '@/api/server'
import { getToken } from '@/utils/token'

interface FavoriteRow {
  id: number
  jobName: string
  /** 公司 · 城市 · 经验 */
  meta: string
  /** 城市，用于筛选 */
  city: string
  tags: string[]
  salary: string
  /** 岗位匹配度，未分析过为 null */
  score: number | null
  /** 收藏时间戳，用于排序 */
  timestamp: number
  favoriteText: string
}

const SORT_OPTIONS = [
  { value: 'time', label: '最近收藏' },
  { value: 'score', label: '匹配度优先' },
] as const

/** 每页条数，与设计稿每屏 8 行一致 */
const PAGE_SIZE = 8

const router = useRouter()

const isLoggedIn = Boolean(getToken())
const loading = ref(false)
const error = ref('')
const rows = ref<FavoriteRow[]>([])

const activeCity = ref('')
const keyword = ref('')
const sortKey = ref<(typeof SORT_OPTIONS)[number]['value']>('time')
const page = ref(1)


/** 城市筛选点击 */
const handleCityClick = (city: string) => {
  activeCity.value = city

}

/** 后端时间可能是 "YYYY-MM-DD HH:mm:ss"，补成标准格式再解析 */
const parseTime = (time: string) => {
  const date = new Date(time.includes('T') ? time : time.replace(' ', 'T'))
  return date.getTime()
}

/** 收藏时间文案：11 月 6 日收藏，跨年补年份 */
const formatFavoriteTime = (time: string) => {
  const timestamp = parseTime(time)
  if (Number.isNaN(timestamp)) return ''

  const date = new Date(timestamp)
  const day = `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  const now = new Date()
  return `${date.getFullYear() === now.getFullYear() ? day : `${date.getFullYear()} 年 ${day}`}收藏`
}

const buildRow = (item: FavoriteJobItem, score: number | null): FavoriteRow => ({
  id: item.id,
  jobName: item.jobName || '未命名职位',
  meta: [item.company, [item.city, item.district].filter(Boolean).join('·'), item.experience]
    .filter(Boolean)
    .join(' · '),
  city: item.city,
  tags: (item.skillTags ?? []).slice(0, 3),
  salary: `${item.salaryMin}–${item.salaryMax}K`,
  score,
  timestamp: parseTime(item.favoriteTime),
  favoriteText: formatFavoriteTime(item.favoriteTime),
})

/** 拉取收藏列表，并用已保存的匹配报告补上匹配度 */
const loadFavorites = async () => {
  if (!isLoggedIn || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const [favorites, reports] = await Promise.all([
      getFavoriteList(),
      // 匹配报告只是加分项，失败不阻塞列表
      getMatchReportList().catch(() => ({ list: [], total: 0 })),
    ])

    const scoreMap = new Map(reports.list.map((item) => [item.jobId, Math.round(item.score)]))
    rows.value = favorites.list.map((item) => buildRow(item, scoreMap.get(item.id) ?? null))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '收藏列表加载失败'
  } finally {
    loading.value = false
  }
}

/** 标题下方汇总：总数 + 最近收藏时间 */
const summaryText = computed(() => {
  if (!rows.value.length) return '还没有收藏记录'

  const latest = rows.value.reduce(
    (max, row) => (Number.isNaN(row.timestamp) || row.timestamp < max ? max : row.timestamp),
    0,
  )

  return [
    `${rows.value.length} 个职位`,
    latest ? `最近收藏 ${formatFavoriteTime(new Date(latest).toISOString()).replace('收藏', '')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
})

/** 城市筛选：全部 + 各城市数量（数量多的排前面） */
const cityTabs = computed(() => {
  const map = new Map<string, number>()
  for (const row of rows.value) {
    const city = row.city || '其他'
    map.set(city, (map.get(city) ?? 0) + 1)
  }

  return [
    { value: '', label: '全部', count: rows.value.length },
    ...[...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([city, count]) => ({ value: city, label: city, count })),
  ]
})

const currentSortLabel = computed(
  () => SORT_OPTIONS.find((option) => option.value === sortKey.value)?.label ?? '最近收藏',
)

/** 城市 + 关键词过滤，再按收藏时间或匹配度排序 */
const filteredRows = computed(() => {
  const search = keyword.value.trim().toLowerCase()

  return rows.value
    .filter((row) => {
      if (activeCity.value && row.city !== activeCity.value) return false
      if (!search) return true
      return `${row.jobName} ${row.meta} ${row.tags.join(' ')}`.toLowerCase().includes(search)
    })
    .sort((a, b) => {
      if (sortKey.value === 'score') {
        const scoreA = a.score ?? -1
        const scoreB = b.score ?? -1
        if (scoreA !== scoreB) return scoreB - scoreA
      }
      return b.timestamp - a.timestamp
    })
})

const pagedRows = computed(() =>
  filteredRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

// 筛选条件变化时回到第一页
watch([activeCity, keyword, sortKey], () => {
  page.value = 1
})

const handleSort = (command: string | number | object) => {
  if (command === 'time' || command === 'score') sortKey.value = command
}

const openJob = (row: FavoriteRow) => router.push(`/job/${row.id}?name=favorites`)

/** 取消收藏：成功后就地从列表移除，无需整页刷新 */
const unfavorite = async (row: FavoriteRow) => {
  try {
    await removeFavorite(row.id)
    rows.value = rows.value.filter((item) => item.id !== row.id)
    ElMessage.success('已取消收藏')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

onMounted(loadFavorites)
</script>

<style scoped lang="scss">
.favorites {
  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #17252b;
  background: #f4f8f7;

  .favorites__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    padding: 40px 40px 60px;
    margin: 0 auto;
  }

  .favorites__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }

  .favorites__title {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -1px;
    color: #17252b;
  }

  .favorites__summary {
    margin: 12px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: #65747c;
  }

  .favorites__create {
    flex-shrink: 0;
    height: 40px;
    padding: 0 22px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 10px;

    --el-button-text-color: #007c77;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #cfe1dd;
    --el-button-hover-text-color: #007c77;
    --el-button-hover-bg-color: #f2faf8;
    --el-button-hover-border-color: #b9dad5;
    --el-button-active-bg-color: #e8f7f4;
    --el-button-active-border-color: #b9dad5;
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

  // ---------- 收藏列表 ----------
  .sheet {
    min-height: 240px;
    padding: 10px 32px;
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

  .sheet .row:not(:last-child) {
    border-bottom: 1px solid #edf2f2;
  }

  .row__main {
    flex: 1;
    min-width: 0;
  }

  .row__title {
    margin: 0;
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
    margin: 6px 0 0;
    overflow: hidden;
    font-size: 11.5px;
    line-height: 1.4;
    color: #8a979e;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row__tags {
    margin: 5px 0 0;
    overflow: hidden;
    font-size: 11px;
    line-height: 1.5;
    color: #65747c;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row__side {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .row__salary {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.4px;
    color: #007c77;
  }

  .row__match {
    font-size: 10px;
    color: #8a979e;

    b {
      font-size: 14px;
      font-weight: 700;
      color: #007c77;
    }
  }

  .row__match-label {
    font-size: 10px;
  }

  .row__time {
    font-size: 10px;
    color: #a1acb3;
  }

  .row__star {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: #007c77;
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: 8px;
    transition:
      color 0.18s ease,
      background-color 0.18s ease;

    &:hover {
      color: #b4413f;
      background: #fef0f0;
    }
  }

  .row__chevron {
    flex-shrink: 0;
    color: #b7c4c4;
  }

  .favorites__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }

  .favorites__note {
    font-size: 10.5px;
    color: #8a979e;
  }

  // ---------- 未登录 ----------
  .favorites__gate {
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

  .favorites__gate-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #17252b;
  }

  .favorites__gate-desc {
    margin: 0;
    font-size: 12px;
    color: #8a979e;
  }

  .favorites__gate-btn {
    margin-top: 10px;
    border-radius: 10px;

    --el-button-bg-color: #007c77;
    --el-button-border-color: #007c77;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
  }

  // ---------- 响应式 ----------
  @media (max-width: 1023.98px) {
    .favorites__inner {
      padding: 32px 20px 48px;
    }

    .favorites__title {
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
      padding: 8px 18px;
      border-radius: 14px;
    }

    .row {
      gap: 12px;
    }

    .row__salary {
      font-size: 16px;
    }
  }

  @media (max-width: 640px) {
    .favorites__inner {
      padding: 24px 16px 40px;
    }

    .favorites__head {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .favorites__title {
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

    .row__star,
    .row__chevron {
      display: none;
    }
  }
}
</style>
