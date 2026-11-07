<template>
  <div class="job-search">
    <!-- 搜索条 -->
    <section class="searchband">
      <div class="job-search__inner searchband__inner">
        <!-- 左侧标题 + 当前搜索条件 -->
        <div class="searchband__lead">
          <h1 class="searchband__title">职位搜索</h1>
          <p class="searchband__desc">{{ summaryText }} · 共 {{ totalText }} 个职位</p>
        </div>

        <div class="searchband__bar">
          <el-input ref="searchInputRef" v-model="keywordInput" class="searchband__input"
            placeholder="搜索职位、公司或技能，例如「前端开发」" :prefix-icon="Search" clearable @keyup.enter="applySearch" />
          <el-button type="primary" class="searchband__btn" @click="applySearch">搜索</el-button>
        </div>
      </div>
    </section>

    <div class="job-search__inner job-search__content">
      <!-- 筛选条件 -->
      <div class="filters">
        <div class="filters__item">
          <CityAutocomplete v-model="filters.city" placeholder="城市" @change="applyFilters" />
        </div>

        <el-select v-model="filters.experience" class="filters__item" placeholder="工作经验" clearable
          @change="applyFilters">
          <el-option v-for="item in EXPERIENCE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="filters.salary" class="filters__item" placeholder="薪资待遇" clearable @change="applyFilters">
          <el-option v-for="item in SALARY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-button link class="filters__clear" @click="clearFilters">清空</el-button>
      </div>

      <div class="result">
        <!-- 左：职位列表 -->
        <section class="list">
          <header class="list__head">
            <h2 class="list__title">推荐职位</h2>
            <span class="list__summary">{{ summaryText }}</span>
          </header>

          <div v-loading="loading && !jobs.length" class="list__body">
            <article v-for="job in jobs" :key="job.id" class="row" :class="{ 'row--active': job.id === activeId }"
              @click="selectJob(job)">
              <div class="row__top">
                <h3 class="row__title">{{ job.job_name }}</h3>
                <span class="row__salary">{{ formatSalary(job) }}</span>
              </div>

              <div v-if="job.skill_tags?.length" class="row__tags">
                <span v-for="tag in job.skill_tags.slice(0, 3)" :key="tag" class="row__tag">{{ formatTag(tag) }}</span>
              </div>

              <div class="row__bottom">
                <span class="row__company">{{ job.company }}</span>
                <span class="row__region">{{ filters.city || '地区不限' }}</span>
              </div>
              <p class="row__experience">{{ job.experience || '经验不限' }}</p>
            </article>

            <el-empty v-if="!loading && !jobs.length" description="没有找到匹配的职位，换个关键词试试。" :image-size="80" />
          </div>

          <footer class="list__footer">
            <el-button v-if="hasMore" class="list__more" :loading="loading" @click="loadMore">加载更多</el-button>
            <span v-else-if="jobs.length" class="list__end">没有更多了</span>
          </footer>
        </section>

        <!-- 右：当前职位详情 -->
        <section ref="detailRef" class="detail">
          <div ref="detailScrollRef" class="detail__scroll" @scroll.passive="handleDetailScroll">
            <div v-if="detailLoading" v-loading="true" class="detail__placeholder"></div>

            <template v-else-if="detail">
              <!-- 固定区：标题、基础信息与操作，详情滚动时始终吸在顶部 -->
              <div class="detail__fixed" :style="fixedStyle">
                <header class="detail__head">
                  <h2 class="detail__title">{{ detail.job_name }}</h2>
                  <p class="detail__salary">{{ formatSalary(detail) }}</p>
                </header>

                <p class="detail__meta">{{ detailMeta }}</p>
                <p class="detail__company">{{ detail.company }}</p>

                <div class="detail__actions">
                  <el-button class="detail__btn detail__btn--primary" @click="matchVisible = true">AI 分析匹配度</el-button>
                  <el-button type="primary" class="detail__btn " @click="jdVisible = true">JD
                    岗位描述</el-button>
                  <el-button class="detail__icon-btn" :icon="detail.favorited ? StarFilled : Star"
                    :title="detail.favorited ? '取消收藏' : '收藏'" :loading="favoriting" @click="toggleFavorite" />
                  <el-button class="detail__icon-btn" :icon="Share" title="分享" @click="handleShare" />
                  <el-button link class="detail__more" @click="goFullDetail(detail.id)">查看完整详情</el-button>
                </div>

                <div class="detail__divider"></div>
              </div>

              <!-- 滚动区：职位描述 / 任职要求 / 工作地址 -->
              <div class="detail__body">
                <h3 class="detail__section">职位描述</h3>
                <ul v-if="descriptionLines.length" class="detail__text-list">
                  <li v-for="(line, index) in descriptionLines" :key="index">{{ line }}</li>
                </ul>
                <p v-else class="detail__text">该岗位暂未提供详细描述。</p>

                <h3 class="detail__section">任职要求</h3>
                <ul class="detail__list">
                  <li>经验要求：{{ detail.experience || '经验不限' }}</li>
                  <li v-if="shortTags.length">技能要求：{{ shortTags.join('、') }}</li>
                </ul>

                <div class="detail__divider"></div>

                <h3 class="detail__section">工作地址</h3>
                <p class="detail__text detail__address">
                  <el-icon>
                    <Location />
                  </el-icon>
                  {{ detailLocation || '地址暂未提供' }}
                </p>
              </div>
            </template>

            <el-empty v-else description="选择左侧职位查看详情" />
          </div>

          <!-- AI 匹配分析：与岗位详情页一致，盖住整个页面 -->
          <AiMatchPanel v-if="detail" v-model="matchVisible" :job-id="detail.id" :job-title="detail.job_name"
            mode="page" />

          <!-- JD 岗位描述：与 AI 匹配分析一致，盖住整个页面 -->
          <JdDescriptionPanel v-if="detail" v-model="jdVisible" :job="detail" mode="page" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Search, Share, Star, StarFilled } from '@element-plus/icons-vue'
import type { InputInstance } from 'element-plus'

import { addFavorite, getJobDetail, getJobList, removeFavorite, type JobDetail } from '@/api/server'
import { getToken } from '@/utils/token'

import AiMatchPanel from '@/components/ai-match-panel.vue'
import CityAutocomplete from '@/components/city-autocomplete.vue'
import JdDescriptionPanel from '@/components/jd-description-panel.vue'

/** 列表接口返回的岗位行（比详情少了城市等字段） */
interface JobRow {
  id: number
  job_name: string
  company: string
  salary_min: number
  salary_max: number
  experience: string
  skill_tags: string[]
}

/** 经验区间：value 用来放进 URL，同时映射到接口的 min / max */
const EXPERIENCE_OPTIONS = [
  { label: '1 年以下', value: '0-1', min: '', max: '1' },
  { label: '1-3 年', value: '1-3', min: '1', max: '3' },
  { label: '3-5 年', value: '3-5', min: '3', max: '5' },
  { label: '5 年以上', value: '5-', min: '5', max: '' },
]

/** 薪资区间（单位 K） */
const SALARY_OPTIONS = [
  { label: '10-20K', value: '10-20', min: '10', max: '20' },
  { label: '20-30K', value: '20-30', min: '20', max: '30' },
  { label: '30-40K', value: '30-40', min: '30', max: '40' },
  { label: '40K 以上', value: '40-', min: '40', max: '' },
]

const PAGE_SIZE = 8
const DESCRIPTION_MIN_LENGTH = 10
const MAX_TAG_LENGTH = 30

const route = useRoute()
const router = useRouter()

const searchInputRef = ref<InputInstance>()
const keywordInput = ref('')

/** 当前生效的筛选条件（由 URL query 驱动） */
const filters = reactive({ city: '', experience: '', salary: '' })

const jobs = ref<JobRow[]>([])
const total = ref(0)
const page = ref(1)
const finished = ref(false)
const loading = ref(false)

const activeId = ref<number | null>(null)
const detail = ref<JobDetail | null>(null)
const detailLoading = ref(false)
const favoriting = ref(false)

/** AI 匹配分析面板显隐 */
const matchVisible = ref(false)

/** JD 岗位描述面板显隐 */
const jdVisible = ref(false)

/** 右侧详情容器：切换岗位时把滚动位置回到顶部 */
const detailRef = ref<HTMLElement | null>(null)
/** 详情内部滚动容器 */
const detailScrollRef = ref<HTMLElement | null>(null)

/** 固定区阴影强度 0–1：随滚动距离增大，滚满 SHADOW_RANGE 后到最强 */
const SHADOW_RANGE = 80
const shadowProgress = ref(0)

/** 滚动回调：只算比例，不直接改 DOM，交给计算属性生成样式 */
const handleDetailScroll = () => {
  const scrolled = detailScrollRef.value?.scrollTop ?? 0
  shadowProgress.value = Math.min(scrolled / SHADOW_RANGE, 1)
}

/** 固定区底部的投影：透明度跟着滚动进度增长 */
const fixedStyle = computed(() => {
  const alpha = (0.32 * shadowProgress.value).toFixed(3)
  return {
    boxShadow: shadowProgress.value > 0 ? `0 10px 18px -12px rgba(23, 37, 43, ${alpha})` : 'none',
  }
})

const hasMore = computed(() => !finished.value && jobs.value.length > 0)

/** 总数展示：只保留首位，其余位补 0 并加 +，如 128 → 100+、5 → 5+ */
const totalText = computed(() => {
  const digits = String(total.value)
  if (!total.value) return '0+'
  return `${digits[0]}${'0'.repeat(digits.length - 1)}+`
})

/** 顶部一句话概括当前生效的搜索条件（读 URL，不读输入框，避免边打字边变） */
const summaryText = computed(() => {
  const parts = [String(route.query.keyword ?? ''), String(route.query.city ?? '')].filter(Boolean)
  return parts.length ? parts.join(' · ') : '全部职位'
})

const detailLocation = computed(() => {
  if (!detail.value) return ''
  return [detail.value.city, detail.value.district].filter(Boolean).join(' · ')
})

const detailMeta = computed(() => {
  if (!detail.value) return ''
  return [detailLocation.value, detail.value.experience].filter(Boolean).join('　　')
})

const allTags = computed(() => detail.value?.skill_tags ?? [])
const descriptionLines = computed(() => allTags.value.filter((tag) => tag.length >= DESCRIPTION_MIN_LENGTH))
const shortTags = computed(() => allTags.value.filter((tag) => tag.length < DESCRIPTION_MIN_LENGTH))

const formatSalary = (job: JobRow) => `${job.salary_min}–${job.salary_max}K`

const formatTag = (tag: string) =>
  tag.length > MAX_TAG_LENGTH ? `${tag.slice(0, MAX_TAG_LENGTH - 3)}...` : tag

/** 把当前输入与筛选条件拼成 query，空值不写入 */
const buildQuery = () => {
  const query: Record<string, string> = {}
  const keyword = keywordInput.value.trim()
  if (keyword) query.keyword = keyword
  if (filters.city) query.city = filters.city
  if (filters.experience) query.exp = filters.experience
  if (filters.salary) query.salary = filters.salary
  return query
}

/** 点搜索：把条件写进 URL，由路由监听统一触发查询 */
const applySearch = () => {
  router.push({ path: '/jobs', query: buildQuery() })
}

/** 改筛选条件：同样走 URL，保证可分享、可回退 */
const applyFilters = () => {
  router.push({ path: '/jobs', query: buildQuery() })
}

/** 清空全部条件 */
const clearFilters = () => {
  keywordInput.value = ''
  filters.city = ''
  filters.experience = ''
  filters.salary = ''
  router.push({ path: '/jobs' })
}

/** 拉取指定页；append 为 false 时覆盖已有列表 */
const fetchJobs = async (targetPage: number, append: boolean) => {
  if (loading.value) return

  loading.value = true

  try {
    const experience = EXPERIENCE_OPTIONS.find((item) => item.value === filters.experience)
    const salary = SALARY_OPTIONS.find((item) => item.value === filters.salary)

    const res = await getJobList({
      page: targetPage,
      size: PAGE_SIZE,
      city: filters.city,
      experienceMin: experience?.min ?? '',
      experienceMax: experience?.max ?? '',
      salaryMin: salary?.min ?? '',
      salaryMax: salary?.max ?? '',
      keyword: keywordInput.value.trim(),
      jobName: '',
    })

    jobs.value = append ? [...jobs.value, ...res.list] : res.list
    total.value = res.total
    page.value = targetPage
    finished.value = jobs.value.length >= res.total || res.list.length < PAGE_SIZE

    // 首次进入或当前选中的岗位已不在结果里时，默认选中第一条
    const stillExists = jobs.value.some((job) => job.id === activeId.value)
    if (!stillExists) {
      activeId.value = jobs.value[0]?.id ?? null
      await fetchDetail()
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '职位加载失败')
    if (!append) {
      jobs.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (finished.value || loading.value) return
  await fetchJobs(page.value + 1, true)
}

/** 拉取右侧详情（含城市、收藏状态） */
const fetchDetail = async () => {
  const id = activeId.value
  if (!id) {
    detail.value = null
    return
  }

  detailLoading.value = true
  if (detailScrollRef.value) detailScrollRef.value.scrollTop = 0
  shadowProgress.value = 0
  try {
    detail.value = await getJobDetail(id)
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

const selectJob = (job: JobRow) => {
  if (job.id === activeId.value) return
  activeId.value = job.id
  fetchDetail()
}

/** 收藏 / 取消收藏 */
const toggleFavorite = async () => {
  if (!detail.value) return

  if (!getToken()) {
    ElMessage.warning('登录后才能收藏岗位')
    router.push('/login')
    return
  }

  favoriting.value = true
  try {
    if (detail.value.favorited) {
      await removeFavorite(detail.value.id)
      detail.value.favorited = false
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite(detail.value.id)
      detail.value.favorited = true
      ElMessage.success('已收藏')
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  } finally {
    favoriting.value = false
  }
}

const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制地址栏链接')
  }
}

const goFullDetail = (id: number) => router.push(`/job/${id}`)

/** 路由 query 变化（搜索、改筛选、浏览器前进后退）时重新查询 */
watch(
  () => route.fullPath,
  () => {
    if (route.path !== '/jobs') return

    keywordInput.value = String(route.query.keyword ?? '')
    filters.city = String(route.query.city ?? '')
    filters.experience = String(route.query.exp ?? '')
    filters.salary = String(route.query.salary ?? '')

    activeId.value = null
    detail.value = null
    page.value = 1
    finished.value = false
    fetchJobs(1, false)
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.job-search {
  --jv-primary: #007c77;
  --jv-ink: #17252b;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-border: #dde8e6;
  --jv-line: #edf2f2;
  --jv-soft: #e8f7f4;

  // 整页占满可用高度：内部左右两栏各自滚动，页面本身不出现纵向滚动
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--jv-ink);
  background: #f4f8f7;

  .job-search__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    padding: 0 40px;
    margin: 0 auto;
  }

  // 筛选 + 结果区：高度交给 flex 分配，结果区再往下传给左右两张卡片
  .job-search__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  @media (max-width: 1023.98px) {
    .job-search__inner {
      padding: 0 24px;
    }

    // 窄屏改为整页滚动，两栏上下排列
    height: auto;
    min-height: 100%;
    overflow: visible;

    .job-search__content {
      display: block;
    }
  }

  @media (max-width: 640px) {
    .job-search__inner {
      padding: 0 16px;
    }
  }
}

// ---------- 搜索条 ----------
.searchband {
  flex-shrink: 0;
  background: #e8f6f2;
  border-bottom: 1px solid #d6e8e3;

  .searchband__inner {
    display: flex;
    align-items: center;
    gap: 24px;
    height: 84px;
  }

  .searchband__lead {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 4px;
  }

  .searchband__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--jv-ink);
  }

  .searchband__desc {
    margin: 0;
    font-size: 11.5px;
    color: #5c7772;
  }

  .searchband__bar {
    display: flex;
    flex: 1;
    gap: 8px;
    max-width: 720px;
    padding: 4px;
    margin-left: auto;
    background: #ffffff;
    border: 1px solid #cbe0dc;
    border-radius: 12px;
  }

  .searchband__input {
    flex: 1;

    :deep(.el-input__wrapper) {
      min-height: 40px;
      padding: 0 8px 0 12px;
      background: transparent;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      color: var(--jv-ink);
    }
  }

  .searchband__btn {
    flex-shrink: 0;
    width: 88px;
    height: 40px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 9px;

    --el-button-text-color: #ffffff;
    --el-button-bg-color: var(--jv-primary);
    --el-button-border-color: var(--jv-primary);
    --el-button-hover-text-color: #ffffff;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-active-bg-color: #00605c;
    --el-button-active-border-color: #00605c;
  }

  @media (max-width: 1023.98px) {
    .searchband__inner {
      flex-wrap: wrap;
      height: auto;
      padding-top: 14px;
      padding-bottom: 14px;
      row-gap: 10px;
    }

    .searchband__bar {
      max-width: none;
      margin-left: 0;
    }
  }
}

// ---------- 筛选 ----------
.filters {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 18px 0;

  .filters__item {
    width: 128px;

    :deep(.el-select__wrapper) {
      min-height: 34px;
      font-size: 12px;
      border-radius: 8px;
      box-shadow: 0 0 0 1px #d8e2e3 inset;

      --el-select-border-color-hover: #bfdcd7;
    }

    // 城市输入框与右侧两个下拉保持同一外观
    :deep(.el-input__wrapper) {
      min-height: 34px;
      padding: 0 10px;
      border-radius: 8px;
      box-shadow: 0 0 0 1px #d8e2e3 inset;
    }

    :deep(.el-input__inner) {
      font-size: 12px;
    }
  }

  .filters__clear {
    height: auto;
    padding: 0;
    margin-left: auto;
    font-size: 11.5px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
  }

  @media (max-width: 640px) {
    .filters__item {
      width: calc(50% - 6px);
    }

    .filters__clear {
      margin-left: 0;
    }
  }
}

// ---------- 结果区 ----------
.result {
  display: grid;
  flex: 1;
  // 两列宽度都可收缩，避免窄屏时被固定宽度撑出屏幕
  grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
  gap: 32px;
  min-width: 0;
  min-height: 0;
  padding-bottom: 24px;
  overflow: hidden;

  @media (max-width: 1199.98px) {
    grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
    gap: 24px;
  }

  @media (max-width: 1023.98px) {
    grid-template-columns: minmax(0, 1fr);
    overflow: visible;
  }
}

// ---------- 左侧列表 ----------
.list {
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 16px;

  // 隐藏滚动条，仍可正常滚动
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .list__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--jv-line);
  }

  .list__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .list__summary {
    font-size: 10.5px;
    color: var(--jv-faint);
  }

  .list__body {
    min-height: 200px;
  }

  .list__footer {
    display: flex;
    justify-content: center;
    padding: 14px;
  }

  .list__more {
    height: 34px;
    padding: 0 20px;
    font-size: 12px;
    border-radius: 8px;

    --el-button-text-color: var(--jv-primary);
    --el-button-border-color: #cfe1dd;
    --el-button-bg-color: #ffffff;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f3faf8;
    --el-button-hover-border-color: #bfdcd7;
  }

  .list__end {
    font-size: 11px;
    color: var(--jv-faint);
  }
}

.row {
  position: relative;
  padding: 18px 20px;
  cursor: pointer;
  border-bottom: 1px solid var(--jv-line);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafdfc;
  }

  &.row--active {
    background: var(--jv-soft);

    &::before {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 2px;
      content: '';
      background: var(--jv-primary);
    }
  }

  .row__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .row__title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .row__salary {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--jv-primary);
    white-space: nowrap;
  }

  .row__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: nowrap;
  }

  .row__tag {
    max-width: 160px;
    padding: 3px 8px;
    overflow: hidden;
    font-size: 10px;
    color: var(--jv-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    background: #f3f7f7;
    border-radius: 5px;
  }

  .row--active & .row__tag {
    background: #ffffff;
  }

  .row__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
  }

  .row__company {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--jv-text);
  }

  .row__region {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--jv-faint);
  }

  .row__experience {
    margin: 6px 0 0;
    font-size: 10.5px;
    color: var(--jv-faint);
  }
}

// ---------- 右侧详情 ----------
.detail {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 16px;

  // 内部滚动容器，滚动条隐藏但可正常滚动
  .detail__scroll {
    box-sizing: border-box;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .detail__placeholder {
    box-sizing: border-box;
    min-height: 400px;
    padding: 24px 28px;
  }

  // 固定区：详情滚动时吸附在卡片顶部
  .detail__fixed {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 16px 28px 0;
    // 顶部一点青绿色渐变，与站点主色呼应；往下过渡到纯白承接正文
    background: linear-gradient(180deg, #eef9f7 0%, #ffffff 72%);
    border-radius: 16px 16px 0 0;
    // 阴影由滚动进度控制，加短过渡避免跳动
    transition: box-shadow 0.12s linear;
  }

  .detail__body {
    padding: 20px 28px 28px;
  }

  .detail__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
  }

  .detail__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.8px;
  }

  .detail__salary {
    flex-shrink: 0;
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--jv-primary);
    white-space: nowrap;
  }

  .detail__meta {
    margin: 8px 0 0;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .detail__company {
    margin: 8px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--jv-text);
  }

  .detail__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }

  .detail__btn {
    height: 40px;
    padding: 0 20px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 9px;

    --el-button-text-color: var(--jv-text);
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
    --el-button-active-border-color: #bfdcd7;
  }

  .detail__btn--primary {
    font-weight: 600;

    --el-button-text-color: #ffffff;
    --el-button-bg-color: var(--jv-primary);
    --el-button-border-color: var(--jv-primary);
    --el-button-hover-text-color: #ffffff;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-active-bg-color: #00605c;
    --el-button-active-border-color: #00605c;
  }

  .detail__icon-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 16px;
    border-radius: 9px;

    --el-button-text-color: #56666e;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
  }

  .detail__more {
    height: auto;
    padding: 0;
    margin-left: auto;
    font-size: 11.5px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
  }

  .detail__divider {
    height: 1px;
    margin: 16px 0;
    background: var(--jv-line);
  }

  // 固定区里的分割线贴住底边，滚动内容不会从缝隙里透出来
  .detail__fixed .detail__divider {
    margin-bottom: 0;
  }

  .detail__section {
    margin: 24px 0 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;

    &:first-of-type {
      margin-top: 0;
    }
  }

  .detail__text {
    margin: 0;
    font-size: 13.5px;
    line-height: 1.85;
    color: #4f6068;
  }

  .detail__text-list,
  .detail__list {
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      font-size: 13.5px;
      line-height: 1.9;
      color: #4f6068;
    }
  }

  // 任职要求用青色圆点，与设计稿一致
  .detail__list li {
    position: relative;
    padding-left: 16px;

    &::before {
      position: absolute;
      top: 10px;
      left: 2px;
      width: 4px;
      height: 4px;
      content: '';
      background: #00bebd;
      border-radius: 50%;
    }
  }

  .detail__address {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4f6068;
  }

  @media (max-width: 640px) {
    .detail__placeholder {
      padding: 18px 20px;
    }

    .detail__fixed {
      padding: 18px 20px 0;
    }

    .detail__body {
      padding: 16px 20px 20px;
    }

    .detail__head {
      flex-direction: column;
      gap: 6px;
    }

    .detail__title {
      font-size: 20px;
    }

    .detail__salary {
      font-size: 18px;
    }

    .detail__more {
      margin-left: 0;
    }
  }
}

// 窄屏上下排列时改回整页滚动，两张卡片不再固定为一屏高
@media (max-width: 1023.98px) {

  .list,
  .detail {
    height: auto;
    max-height: 70vh;
  }

  // 高度由内容撑开，滚动交给内部容器并限制最大高度
  .detail__scroll {
    height: auto;
    max-height: 70vh;
  }
}
</style>
