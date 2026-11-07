<template>
  <div class="job-detail">
    <div class="job-detail__inner">
      <!-- 面包屑 + 返回 -->
      <div class="job-detail__crumbs">
        <el-breadcrumb separator="/" class="job-detail__breadcrumb">
          <el-breadcrumb-item :to="{ path: '/' }">职位</el-breadcrumb-item>
          <el-breadcrumb-item>{{ job?.job_name || '岗位详情' }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-button v-if="route.query.name === 'favorites'" link class="job-detail__back" :icon="ArrowLeft"
          @click="goBack">返回职位列表</el-button>
      </div>

      <!-- 首次加载占位，避免内容闪动 -->
      <div v-if="loading" v-loading="true" class="job-detail__placeholder"></div>

      <!-- 加载失败 -->
      <el-empty v-else-if="error" :description="error" class="job-detail__placeholder">
        <el-button type="primary" @click="fetchDetail">重新加载</el-button>
      </el-empty>

      <div v-else-if="job" class="job-detail__body">
        <!-- 左侧：岗位主体 -->
        <section class="sheet">
          <header class="sheet__head">
            <h1 class="sheet__title">{{ job.job_name }}</h1>
            <p class="sheet__salary">{{ salaryText }}</p>
          </header>

          <p class="sheet__meta">{{ metaText }}</p>
          <p class="sheet__company">{{ job.company }}</p>

          <div v-if="shortTags.length" class="sheet__tags">
            <el-tag v-for="tag in shortTags" :key="tag" size="small" effect="light" class="sheet__tag">
              {{ tag }}
            </el-tag>
          </div>

          <div class="sheet__actions">
            <el-button type="primary" class="sheet__btn sheet__btn--primary" @click="matchVisible = true">AI
              分析匹配度</el-button>
            <el-button class="sheet__btn" @click="jdVisible = true">JD 岗位描述</el-button>
            <el-button class="sheet__icon-btn" :icon="job.favorited ? StarFilled : Star" :loading="favoriting"
              :title="job.favorited ? '取消收藏' : '收藏'" @click="toggleFavorite" />
            <el-button class="sheet__icon-btn" :icon="Share" title="分享" @click="handleShare" />
            <span class="sheet__publish">{{ publishText }}</span>
          </div>

          <div class="sheet__divider"></div>

          <h2 class="sheet__section-title">职位描述</h2>
          <ul v-if="descriptionLines.length" class="sheet__list">
            <li v-for="(line, index) in descriptionLines" :key="index">{{ line }}</li>
          </ul>
          <p v-else class="sheet__text">该岗位暂未提供详细描述。</p>

          <h2 class="sheet__section-title">任职要求</h2>
          <ul class="sheet__list sheet__list--dot">
            <li>经验要求：{{ job.experience || '经验不限' }}</li>
            <li v-if="shortTags.length">技能要求：{{ shortTags.join('、') }}</li>
          </ul>

          <h2 class="sheet__section-title">公司介绍</h2>
          <p class="sheet__text">{{ job.company }} 的公司介绍暂未收录，可前往公司主页了解更多。</p>

          <h2 class="sheet__section-title">工作地址</h2>
          <p class="sheet__text sheet__address">
            <el-icon class="sheet__address-icon">
              <Location />
            </el-icon>
            {{ locationText || '地址暂未提供' }}
          </p>

          <p class="sheet__safe">求职安全提示：正规招聘不会以任何名义收取费用。</p>
        </section>

        <!-- 右侧：AI 分析 / 公司信息 -->
        <aside class="rail">
          <section class="rail__block">
            <span class="rail__label">AI 岗位分析</span>

            <template v-if="report">
              <div class="rail__score-row">
                <span class="rail__score">{{ report.score }}%</span>
                <span class="rail__score-label">综合匹配</span>
              </div>
              <div class="rail__bar">
                <i class="rail__bar-value" :style="{ width: `${clampScore}%` }"></i>
              </div>
              <p class="rail__desc">{{ reportSummary }}</p>
            </template>

            <div v-else class="rail__empty">
              <p class="rail__empty-text">还没有该岗位的匹配分析</p>
            </div>

            <el-button link class="rail__link" @click="matchVisible = true">
              {{ report ? '查看完整分析' : '去 AI 分析' }}
            </el-button>
          </section>

          <section class="rail__block">
            <span class="rail__label">公司信息</span>
            <h3 class="rail__company">{{ job.company }}</h3>
            <p class="rail__desc">{{ locationText || '地址暂未提供' }}</p>
          </section>

          <section class="rail__block rail__block--safe">
            <p class="rail__safe">正规招聘不会收取任何费用</p>
          </section>
        </aside>
      </div>
    </div>

    <!-- AI 匹配分析：盖住整个页面 -->
    <AiMatchPanel v-if="job" v-model="matchVisible" :job-id="job.id" :job-title="job.job_name" mode="page" />

    <!-- JD 岗位描述：与 AI 匹配分析一致，盖住整个页面 -->
    <JdDescriptionPanel v-if="job" v-model="jdVisible" :job="job" mode="page" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Location, Share, Star, StarFilled } from '@element-plus/icons-vue'

import AiMatchPanel from '@/components/ai-match-panel.vue'
import JdDescriptionPanel from '@/components/jd-description-panel.vue'

import {
  addFavorite,
  getJobDetail,
  getMatchReport,
  removeFavorite,
  type JobDetail,
  type MatchReport,
} from '@/api/server'
import { getToken } from '@/utils/token'

/** 超过这个长度视为描述文本，其余当作技能标签（与岗位描述弹窗保持同一口径） */
const DESCRIPTION_MIN_LENGTH = 10

const route = useRoute()
const router = useRouter()

const job = ref<JobDetail | null>(null)
const report = ref<MatchReport | null>(null)
const loading = ref(true)
const favoriting = ref(false)
const error = ref('')

/** AI 匹配分析面板显隐 */
const matchVisible = ref(false)

/** JD 岗位描述面板显隐 */
const jdVisible = ref(false)

/** 路由上的岗位 ID，非法值直接走错误态 */
const jobId = computed(() => Number(route.params.id))

const salaryText = computed(() => (job.value ? `${job.value.salary_min}–${job.value.salary_max}K` : ''))

const locationText = computed(() => {
  if (!job.value) return ''
  return [job.value.city, job.value.district].filter(Boolean).join(' · ')
})

/** 城市 · 区 + 经验，按设计稿用全角空格分隔 */
const metaText = computed(() => {
  if (!job.value) return ''
  return [locationText.value, job.value.experience].filter(Boolean).join('　　')
})

const allTags = computed(() => job.value?.skill_tags ?? [])
const descriptionLines = computed(() => allTags.value.filter((tag) => tag.length >= DESCRIPTION_MIN_LENGTH))
const shortTags = computed(() => allTags.value.filter((tag) => tag.length < DESCRIPTION_MIN_LENGTH))

/** 匹配度限制在 0–100，避免脏数据把进度条撑破 */
const clampScore = computed(() => Math.min(100, Math.max(0, report.value?.score ?? 0)))

/** 报告正文取第一句作为摘要 */
const reportSummary = computed(() => {
  const text = report.value?.content?.replace(/\s+/g, ' ').trim() ?? ''
  if (!text) return '已生成匹配分析'
  const firstSentence = text.split(/[。；!?！？]/)[0]
  return (firstSentence || text).slice(0, 40)
})

/** 已发布时间：优先 publish_date，缺失时退回创建时间 */
const publishText = computed(() => {
  const raw = job.value?.publish_date || job.value?.created_at
  if (!raw) return '发布时间未知'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '发布时间未知'

  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return '发布于今天'
  if (days === 1) return '发布于 1 天前'
  if (days < 30) return `发布于 ${days} 天前`
  return `发布于 ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
})

/** 岗位详情：只做展示，不依赖登录 */
const fetchDetail = async () => {
  if (!Number.isInteger(jobId.value) || jobId.value <= 0) {
    loading.value = false
    error.value = '岗位 ID 无效'
    return
  }

  loading.value = true
  error.value = ''

  try {
    job.value = await getJobDetail(jobId.value)
    await fetchReport()
  } catch (e) {
    job.value = null
    error.value = e instanceof Error ? e.message : '岗位加载失败'
  } finally {
    loading.value = false
  }
}

/** 已保存的匹配报告：未登录或没有报告都按「未分析」处理 */
const fetchReport = async () => {
  report.value = null
  if (!getToken() || !job.value) return

  try {
    report.value = await getMatchReport(job.value.id)
  } catch {
    // 404 表示还没生成过报告，不当作错误提示
    report.value = null
  }
}

/** 收藏 / 取消收藏：接口需要登录 */
const toggleFavorite = async () => {
  if (!job.value) return

  if (!getToken()) {
    ElMessage.warning('登录后才能收藏岗位')
    router.push('/login')
    return
  }

  favoriting.value = true
  try {
    if (job.value.favorited) {
      await removeFavorite(job.value.id)
      job.value.favorited = false
      ElMessage.success('已取消收藏')
    } else {
      await addFavorite(job.value.id)
      job.value.favorited = true
      ElMessage.success('已收藏')
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  } finally {
    favoriting.value = false
  }
}

/** 分享：把当前地址复制到剪贴板 */
const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制地址栏链接')
  }
}

const goBack = () => {
  router.push('/')
  if (route.query.name === 'favorites') {
    router.push('/favorites')
  }
}

// 详情页内切换岗位（如从收藏列表点进来）时重新拉取
watch(jobId, fetchDetail, { immediate: true })
</script>

<style scoped lang="scss">
.job-detail {
  --jv-primary: #007c77;
  --jv-ink: #17252b;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-border: #dde8e6;
  --jv-line: #edf2f2;

  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--jv-ink);
  background: #f4f8f7;

  .job-detail__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    padding: 0 40px 40px;
    margin: 0 auto;
  }

  .job-detail__crumbs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 0;
  }

  .job-detail__breadcrumb {
    font-size: 11.5px;

    :deep(.el-breadcrumb__inner),
    :deep(.el-breadcrumb__separator) {
      font-size: 11.5px;
      color: var(--jv-faint);
    }

    :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
      font-weight: 500;
      color: var(--jv-text);
    }
  }

  .job-detail__back {
    flex-shrink: 0;
    height: auto;
    padding: 0;
    font-size: 11.5px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
  }

  .job-detail__placeholder {
    min-height: 480px;
    background: #ffffff;
    border: 1px solid var(--jv-border);
    border-radius: 18px;
  }

  .job-detail__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 368px;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 1199.98px) {
    .job-detail__body {
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
    }
  }

  @media (max-width: 1023.98px) {
    .job-detail__inner {
      padding: 0 24px 32px;
    }

    .job-detail__body {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 640px) {
    .job-detail__inner {
      padding: 0 16px 24px;
    }

    .job-detail__crumbs {
      padding: 14px 0;
    }
  }
}

// ---------- 左侧主体 ----------
.sheet {
  padding: 28px;
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 18px;

  .sheet__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
  }

  .sheet__title {
    margin: 0;
    font-size: 30px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.9px;
  }

  .sheet__salary {
    flex-shrink: 0;
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.6px;
    color: var(--jv-primary);
    white-space: nowrap;
  }

  .sheet__meta {
    margin: 14px 0 0;
    font-size: 13px;
    color: var(--jv-muted);
  }

  .sheet__company {
    margin: 10px 0 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--jv-text);
  }

  .sheet__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .sheet__tag {
    height: 26px;
    padding: 0 12px;
    font-size: 10.5px;
    border-radius: 5px;

    --el-tag-bg-color: #f3f7f7;
    --el-tag-border-color: transparent;
    --el-tag-text-color: var(--jv-text);
  }

  .sheet__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 22px;
  }

  .sheet__btn {
    height: 44px;
    padding: 0 22px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 10px;

    --el-button-text-color: var(--jv-text);
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
    --el-button-active-text-color: var(--jv-primary);
    --el-button-active-bg-color: #f7fbfa;
    --el-button-active-border-color: #bfdcd7;
  }

  .sheet__btn--primary {
    padding: 0 28px;
    font-size: 14px;
    font-weight: 600;

    --el-button-text-color: #ffffff;
    --el-button-bg-color: var(--jv-primary);
    --el-button-border-color: var(--jv-primary);
    --el-button-hover-text-color: #ffffff;
    --el-button-hover-bg-color: #006b66;
    --el-button-hover-border-color: #006b66;
    --el-button-active-text-color: #ffffff;
    --el-button-active-bg-color: #00605c;
    --el-button-active-border-color: #00605c;
  }

  .sheet__icon-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    font-size: 17px;
    border-radius: 10px;

    --el-button-text-color: #56666e;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #d8e2e3;
    --el-button-hover-text-color: var(--jv-primary);
    --el-button-hover-bg-color: #f7fbfa;
    --el-button-hover-border-color: #bfdcd7;
    --el-button-active-border-color: #bfdcd7;
  }

  .sheet__publish {
    margin-left: auto;
    font-size: 11px;
    color: var(--jv-faint);
  }

  .sheet__divider {
    height: 1px;
    margin: 24px 0;
    background: var(--jv-line);
  }

  .sheet__section-title {
    margin: 28px 0 12px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.25px;

    &:first-of-type {
      margin-top: 0;
    }
  }

  .sheet__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.85;
    color: #4f6068;
  }

  .sheet__list {
    padding: 0;
    margin: 0;
    list-style: none;

    li {
      font-size: 14px;
      line-height: 1.9;
      color: #4f6068;
    }
  }

  // 任职要求用青色圆点，与设计稿一致
  .sheet__list--dot {
    li {
      position: relative;
      padding-left: 18px;

      &::before {
        position: absolute;
        top: 11px;
        left: 2px;
        width: 4px;
        height: 4px;
        content: '';
        background: #00bebd;
        border-radius: 50%;
      }
    }
  }

  .sheet__address {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sheet__address-icon {
    font-size: 15px;
    color: var(--jv-muted);
  }

  .sheet__safe {
    margin: 28px 0 0;
    font-size: 10.5px;
    color: var(--jv-faint);
  }

  @media (max-width: 640px) {
    padding: 20px;

    .sheet__head {
      flex-direction: column;
      gap: 6px;
    }

    .sheet__title {
      font-size: 22px;
    }

    .sheet__salary {
      font-size: 20px;
    }

    .sheet__publish {
      margin-left: 0;
    }
  }
}

// ---------- 右侧栏 ----------
.rail {
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 18px;
  padding: 0 24px;

  .rail__block {
    padding: 22px 0;

    &+.rail__block {
      border-top: 1px solid var(--jv-line);
    }
  }

  .rail__label {
    display: block;
    margin-bottom: 14px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: #78868f;
  }

  .rail__score-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .rail__score {
    font-size: 42px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -1.4px;
    color: var(--jv-primary);
  }

  .rail__score-label {
    font-size: 11.5px;
    color: #78868f;
  }

  .rail__bar {
    height: 4px;
    margin: 18px 0 14px;
    overflow: hidden;
    background: #e4edea;
    border-radius: 2px;
  }

  .rail__bar-value {
    display: block;
    height: 100%;
    background: #00bebd;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .rail__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--jv-text);
  }

  .rail__empty-text {
    margin: 0 0 4px;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .rail__company {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .rail__link {
    height: auto;
    padding: 0;
    margin-top: 14px;
    font-size: 11.5px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
  }

  .rail__block--safe {
    border-top: 1px solid var(--jv-line);
  }

  .rail__safe {
    margin: 0;
    font-size: 10.5px;
    color: var(--jv-faint);
  }
}
</style>
