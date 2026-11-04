<template>
  <div class="home">
    <!-- 首屏：搜索 + 热门方向（静态演示数据，暂不接入接口） -->
    <section class="hero">
      <div class="home__inner hero__inner">
        <div class="hero__main">
          <h1 class="hero__title">找工作，<br />先看清再投递。</h1>
          <p class="hero__desc">把岗位要求、技能差距和薪资区间，整理成一份能用的判断。</p>

          <div class="search">
            <el-select v-model="city" class="search__city">
              <template #prefix>
                <el-icon>
                  <Location />
                </el-icon>
              </template>
              <el-option v-for="item in cityOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <span class="search__divider"></span>
            <el-input v-model="searchText" class="search__input" placeholder="搜索职位、公司或技能，例如「前端开发」" :prefix-icon="Search"
              clearable @keyup.enter="handleSearch" @clear="handleSearch" />
            <el-button type="primary" class="search__btn" @click="handleSearch">搜索</el-button>
          </div>

          <div class="hero__hot">
            <span class="hero__hot-label">热门搜索</span>
            <el-link v-for="word in hotKeywords" :key="word" :underline="false" class="hero__hot-item"
              @click="pickKeyword(word)">{{ word }}</el-link>
          </div>
        </div>

        <aside class="hero__directions">
          <h2 class="directions__title">热门方向</h2>
          <ul class="directions__grid">
            <li v-for="item in directions" :key="item" class="directions__item">{{ item }}</li>
          </ul>
          <el-link :underline="false" class="directions__more">查看全部职位</el-link>
        </aside>
      </div>
    </section>

    <!-- 热门职业 -->
    <section class="home__inner recommend">
      <div class="recommend__head">
        <div class="recommend__intro">
          <h2 class="recommend__title">热门职业</h2>
        </div>

        <el-tabs v-model="activeTab" class="recommend__tabs">
          <el-tab-pane v-for="tab in tabs" :key="tab" :label="tab" :name="tab" />
        </el-tabs>
      </div>

      <div class="recommend__body">
        <!-- 职位列表 -->
        <el-card shadow="never" class="jobs">
          <article v-for="job in filteredJobs" :key="job.id" class="job">
            <div class="job__top">
              <h3 class="job__title">{{ job.title }}</h3>
              <p class="job__salary">{{ job.salary }}</p>
            </div>
            <div class="job__meta">
              <span>{{ job.region }}</span>
            </div>
            <div class="job__bottom">
              <div class="job__company">{{ job.company }}</div>
            </div>
          </article>

          <el-empty v-if="!jobListLoading && !filteredJobs.length" description="没有找到匹配的岗位，换个关键词试试。" :image-size="72" />
        </el-card>

        <!-- 右侧：求职意向 / 最近分析 / 求职建议 -->
        <SidePanel />
      </div>
    </section>

    <!-- 岗位列表 -->
    <section class="home__inner job-wall">
      <div class="job-wall__head">
        <h2 class="job-wall__title">岗位列表</h2>
        <p class="job-wall__desc">按岗位名称、薪资、地区和技术栈快速浏览</p>
      </div>

      <div v-loading="jobListLoading" class="job-wall__grid">
        <article v-for="item in jobList" :key="item.id" class="job-card">
          <div class="job-card__top">
            <h3 class="job-card__title">{{ item.title }}</h3>
            <span class="job-card__salary">{{ item.salary }}</span>
          </div>
          <p class="job-card__region">{{ item.region }}</p>
          <p class="job-card__company">{{ item.company }}</p>
          <div class="job-card__tags">
            <el-tag v-for="tag in item.skillTags.slice(0, 3)" :key="tag" size="small" effect="light"
              class="job-card__tag" :title="tag">{{ formatTag(tag) }}</el-tag>
          </div>
        </article>
      </div>

      <!-- 滚动到底部时触发加载更多 -->
      <div ref="loadMoreRef" class="job-wall__footer">
        <span v-if="jobListLoading">加载中...</span>
        <span v-else-if="jobListFinished && jobList.length">没有更多了</span>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="home__inner footer">
      <div class="footer__left">
        <span>© 2026 JobVision</span>
        <span>为认真打磨技术的人而设计</span>
      </div>
      <nav class="footer__links">
        <el-link v-for="link in footerLinks" :key="link" :underline="false" class="footer__link">{{ link }}</el-link>
      </nav>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { Location, Search } from '@element-plus/icons-vue'

import { getJobList } from '@/api/server'
import { usePersonalInfoStore } from '@/stores/personalInfo'

import SidePanel from '@/components/home/side-panel.vue'

/** 底部岗位列表卡片 */
interface JobListItem {
  id: number
  title: string
  salary: string
  region: string
  company: string
  skillTags: string[]
}

const hotKeywords = ['前端开发', 'React', 'AI 应用', '产品经理', '数据分析']

const directions = ['前端开发', '后端开发', '人工智能', '产品经理', 'UI/UX 设计', '数据分析', '测试工程', '运营']

const tabs = ['推荐', '最新', '高匹配', '附近']
const activeTab = ref('推荐')

const footerLinks = ['关于我们', '用户协议', '隐私政策', '帮助中心']

/** 城市选项（静态，后续接入 /home/city） */
const cityOptions = ['上海', '北京', '深圳', '杭州']
const city = ref('上海')

/** 搜索框内容与实际生效的筛选词分开：回车/点搜索才生效 */
const searchText = ref('')
const keyword = ref('')

const personalInfoStore = usePersonalInfoStore()

/** 获取个人信息并打印，便于调试 */
const getPersonalInfo = () => {
  try {
    const data = personalInfoStore.info
    console.log('个人信息：', data)
  } catch (error) {
    console.log('获取个人信息失败：', error)
  }
}

/** 标签最多展示 30 个字符，超出部分用 ... 省略 */
const MAX_TAG_LENGTH = 30
const formatTag = (tag: string) =>
  tag.length > MAX_TAG_LENGTH ? `${tag.slice(0, MAX_TAG_LENGTH - 3)}...` : tag

/** 底部岗位列表：GET /api/home/jobList，每页 9 条，滚动到底部自动加载更多 */
const JOB_PAGE_SIZE = 9

const jobList = ref<JobListItem[]>([])
const jobListLoading = ref(false)
const jobListFinished = ref(false)
const jobListPage = ref(1)
const loadMoreRef = ref<HTMLElement | null>(null)
let jobListObserver: IntersectionObserver | null = null

/** 拉取一页岗位并追加到列表 */
const fetchJobList = async () => {
  if (jobListLoading.value || jobListFinished.value) return

  jobListLoading.value = true
  let success = false

  try {
    const res = await getJobList({
      page: jobListPage.value,
      size: JOB_PAGE_SIZE,
      city: city.value,
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      keyword: '',
      jobName: '',
    })

    const list = res.list.map((item) => ({
      id: item.id,
      title: item.job_name,
      salary: `${item.salary_min}–${item.salary_max}K`,
      // jobList 不返回地区字段，这里用请求时筛选的城市展示
      region: city.value || '地区不限',
      company: item.company,
      skillTags: item.skill_tags ?? [],
    }))

    jobList.value = [...jobList.value, ...list]
    jobListPage.value += 1

    // 没有数据或已取满总数，停止后续加载
    if (!list.length || jobList.value.length >= res.total) jobListFinished.value = true
    success = true
  } catch (error) {
    console.log('获取岗位列表失败：', error)
  } finally {
    jobListLoading.value = false

    // 重新观察：首屏不足一屏时，哨兵还在视口内，继续加载下一页
    if (success) {
      await nextTick()
      setupJobListObserver()
    }
  }
}

/** 监听底部哨兵，进入视口（含提前 200px）就加载下一页 */
const setupJobListObserver = () => {
  if (jobListFinished.value) {
    jobListObserver?.disconnect()
    return
  }
  if (!loadMoreRef.value) return

  jobListObserver?.disconnect()
  jobListObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) fetchJobList()
    },
    { rootMargin: '0px 0px 200px 0px' },
  )
  jobListObserver.observe(loadMoreRef.value)
}

onMounted(() => {
  fetchJobList()
  setupJobListObserver()
  getPersonalInfo()
})

onBeforeUnmount(() => {
  jobListObserver?.disconnect()
})

/** 为你推荐：暂时先取 jobList 的前 4 条 */
const hotJobs = computed(() => jobList.value.slice(0, 4))

/** 按关键词过滤推荐岗位（岗位名称 / 公司 / 技术栈命中即可） */
const filteredJobs = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return hotJobs.value
  return hotJobs.value.filter((job) =>
    [job.title, job.company, ...job.skillTags].some((item) => item.toLowerCase().includes(text)),
  )
})

/** 执行搜索：把输入框内容落到实际筛选词 */
const handleSearch = () => {
  keyword.value = searchText.value.trim()
}

/** 点击热门搜索：填入搜索框并直接搜索 */
const pickKeyword = (word: string) => {
  searchText.value = word
  keyword.value = word
}
</script>

<style scoped lang="scss">
.home {
  --jv-primary: #007c77;
  --jv-primary-soft: #e8f7f4;
  --jv-ink: #17252b;
  --jv-text: #3d4b54;
  --jv-muted: #65747c;
  --jv-faint: #8a979e;
  --jv-border: #e2ebe9;
  --jv-line: #edf2f2;

  min-height: 100%;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--jv-ink);
  background: #f4f8f7;

  // 内容区统一定宽：1280 - 左右各 40 = 1200 设计宽度
  .home__inner {
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    margin: 0px auto;
    padding: 0 40px;
  }

  @media (max-width: 1023.98px) {
    .home__inner {
      padding: 0 24px;
    }
  }

  @media (max-width: 640px) {
    .home__inner {
      padding: 0 16px;
    }
  }
}

// ---------- 首屏 ----------
.hero {
  background: #e8f6f2;

  .hero__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 384px;
    gap: 32px;
    padding-top: 48px;
    padding-bottom: 40px;
  }

  .hero__title {
    margin: 0;
    font-size: clamp(36px, 3.75vw, 54px);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -2.2px;
    color: var(--jv-ink);
  }

  .hero__desc {
    margin: 18px 0 0;
    font-size: 16px;
    line-height: 1.6;
    color: #4f6068;
  }

  .hero__hot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    margin-top: 16px;
    font-size: 12.5px;

    .hero__hot-label {
      font-size: 11.5px;
      color: var(--jv-muted);
    }

    .hero__hot-item {
      font-size: 12.5px;
      font-weight: 400;

      --el-link-text-color: var(--jv-text);
      --el-link-hover-text-color: var(--jv-primary);
    }
  }

  // 热门方向：左侧与上方各一条细线，和设计稿的 L 形分割一致
  .hero__directions {
    padding: 28px 0 0 32px;
    border-top: 1px solid #cbe2dc;
    border-left: 1px solid #cbe2dc;

    .directions__title {
      margin: 0 0 16px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.4px;
      color: #5c7772;
    }

    .directions__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 32px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .directions__item {
      padding: 12px 0;
      font-size: 15px;
      font-weight: 500;
      color: var(--jv-text);
      border-bottom: 1px solid #d6e9e4;

      &:nth-last-child(-n + 2) {
        border-bottom: none;
      }
    }

    .directions__more {
      margin-top: 16px;
      font-size: 12px;
      font-weight: 600;

      --el-link-text-color: var(--jv-primary);
      --el-link-hover-text-color: #006b66;
    }
  }

  @media (max-width: 1199.98px) {
    .hero__inner {
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 24px;
    }
  }

  @media (max-width: 1023.98px) {
    .hero__inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
      padding-top: 36px;
      padding-bottom: 32px;
    }

    .hero__directions {
      padding: 24px 0 0;
      margin-top: 28px;
      border-left: none;
    }
  }

  @media (max-width: 640px) {
    .hero__title {
      letter-spacing: -1.2px;
    }

    .hero__hot {
      gap: 12px;
    }
  }
}

// ---------- 搜索 ----------
.search {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  max-width: 744px;
  height: 60px;
  margin-top: 22px;
  padding: 6px 6px 6px 16px;
  background: #ffffff;
  border: 1px solid #cbe0dc;
  border-radius: 14px;

  // el-select 去边框，融进搜索胶囊
  .search__city {
    flex-shrink: 0;
    width: 104px;

    :deep(.el-select__wrapper) {
      min-height: 46px;
      padding: 0;
      font-size: 14px;
      background: transparent;
      box-shadow: none;
    }

    :deep(.el-select__wrapper.is-focused),
    :deep(.el-select__wrapper.is-hovering) {
      box-shadow: none;
    }

    :deep(.el-select__prefix) {
      margin-right: 6px;
      color: var(--jv-muted);
    }

    :deep(.el-select__placeholder) {
      color: var(--jv-text);
    }

    :deep(.el-select__suffix) {
      color: #7d8d94;
    }
  }

  .search__divider {
    flex-shrink: 0;
    width: 1px;
    height: 28px;
    margin: 0 14px;
    background: #e3ebec;
  }

  // el-input 去边框，与胶囊融合
  .search__input {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      min-height: 46px;
      padding: 0;
      background: transparent;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      font-size: 14.5px;
      color: var(--jv-ink);
    }

    :deep(.el-input__prefix) {
      margin-right: 12px;
      color: var(--jv-muted);
    }

    :deep(.el-input__inner::placeholder) {
      color: var(--jv-faint);
    }
  }

  .search__btn {
    flex-shrink: 0;
    width: 112px;
    height: 48px;
    margin-left: 8px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 10px;

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

  @media (max-width: 640px) {
    flex-wrap: wrap;
    height: auto;
    padding: 8px;
    row-gap: 8px;

    .search__city {
      width: 92px;

      :deep(.el-select__wrapper) {
        min-height: 36px;
      }
    }

    .search__input {
      :deep(.el-input__wrapper) {
        min-height: 36px;
      }
    }

    .search__divider {
      height: 20px;
      margin: 0 8px;
    }

    .search__btn {
      flex-basis: 100%;
      width: 100%;
      height: 40px;
      margin-left: 0;
    }
  }
}

// ---------- 推荐 ----------
.recommend {
  padding-top: 46px;
  margin-top: 18px !important;

  .recommend__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }

  .recommend__title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.8px;
  }

  .recommend__desc {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 8px 0 0;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .recommend__edit {
    height: auto;
    padding: 0;
    font-size: 12px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
    --el-button-active-color: #006b66;
  }

  // el-tabs 只保留标签头，样式对齐设计稿
  .recommend__tabs {
    flex-shrink: 0;

    --el-color-primary: var(--jv-primary);

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      height: auto;
      padding: 0 0 10px;
      margin-right: 26px;
      font-size: 13.5px;
      font-weight: 400;
      color: var(--jv-muted);
    }

    :deep(.el-tabs__item:last-child) {
      margin-right: 0;
    }

    :deep(.el-tabs__item:hover) {
      color: var(--jv-primary);
    }

    :deep(.el-tabs__item.is-active) {
      font-weight: 600;
      color: var(--jv-primary);
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      background: var(--jv-primary);
      border-radius: 1px;
    }

    :deep(.el-tabs__content) {
      display: none;
    }
  }

  .recommend__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 372px;
    gap: 48px;
    margin-top: 28px;
  }

  @media (max-width: 1199.98px) {
    .recommend__body {
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 28px;
    }
  }

  @media (max-width: 1023.98px) {
    .recommend__head {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .recommend__body {
      grid-template-columns: minmax(0, 1fr);
      gap: 24px;
    }
  }

  @media (max-width: 640px) {
    .recommend__tabs {
      :deep(.el-tabs__item) {
        margin-right: 18px;
      }
    }
  }
}

// ---------- 岗位列表 ----------
.jobs {
  overflow: hidden;
  border-radius: 16px;

  --el-card-border-color: var(--jv-border);
  --el-card-border-radius: 16px;
  --el-card-padding: 0;

  :deep(.el-empty) {
    padding: 40px 0;
  }

  :deep(.el-empty__description p) {
    margin: 0;
    font-size: 13px;
    color: var(--jv-muted);
  }
}

.job {
  position: relative;
  padding: 20px 28px;
  cursor: pointer;

  // 分割线左右留白，不占满整行
  &::after {
    position: absolute;
    right: 28px;
    bottom: 0;
    left: 28px;
    height: 1px;
    content: '';
    background: var(--jv-line);
  }

  &:last-child::after {
    display: none;
  }

  &:hover {
    background: #fbfdfc;
  }

  .job__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }

  .job__title {
    margin: 0;
    font-size: 18.5px;
    font-weight: 600;
    letter-spacing: -0.25px;
    color: var(--jv-ink);
  }

  .job__salary {
    flex-shrink: 0;
    margin: 0;
    font-size: 17.5px;
    font-weight: 700;
    letter-spacing: -0.4px;
    color: var(--jv-primary);
    white-space: nowrap;

    .job__salary-note {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0;
      color: #4e8983;
    }
  }

  .job__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .job__match {
    flex-shrink: 0;
    height: 23px;
    padding: 0 10px;
    font-size: 10.5px;
    font-weight: 600;
    border-radius: 6px;

    --el-tag-bg-color: var(--jv-primary-soft);
    --el-tag-border-color: transparent;
    --el-tag-text-color: var(--jv-primary);
  }

  .job__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    font-size: 12.5px;
  }

  .job__company {
    font-weight: 500;
    color: var(--jv-text);
  }

  .job__industry {
    margin-left: 8px;
    font-weight: 400;
    color: var(--jv-faint);
  }

  .job__contact {
    flex-shrink: 0;
    font-size: 10.5px;
    color: var(--jv-faint);
  }

  @media (max-width: 1199.98px) {
    padding: 18px 22px;

    &::after {
      right: 22px;
      left: 22px;
    }
  }

  @media (max-width: 640px) {
    padding: 16px;

    &::after {
      right: 16px;
      left: 16px;
    }

    .job__top {
      flex-direction: column;
      gap: 4px;
    }

    .job__bottom {
      flex-wrap: wrap;
    }
  }
}

// ---------- 底部岗位列表 ----------
.job-wall {
  padding-top: 46px;
  margin-top: 26px !important;

  .job-wall__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }

  .job-wall__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.6px;
    color: var(--jv-ink);
  }

  .job-wall__desc {
    margin: 0;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .job-wall__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
    margin-top: 20px;
  }

  .job-wall__footer {
    display: flex;
    justify-content: center;
    min-height: 20px;
    padding-top: 20px;
    font-size: 12px;
    color: var(--jv-muted);
  }

  @media (max-width: 1023.98px) {
    .job-wall__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
    }
  }

  @media (max-width: 640px) {
    padding-top: 32px;

    .job-wall__head {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .job-wall__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
  }
}

.job-card {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  padding: 22px 24px;
  background: #ffffff;
  border: 1px solid var(--jv-border);
  border-radius: 16px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
  }

  .job-card__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .job-card__title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--jv-ink);
  }

  .job-card__salary {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--jv-primary);
    white-space: nowrap;
  }

  .job-card__region {
    margin: 10px 0 0;
    font-size: 12.5px;
    color: var(--jv-muted);
  }

  .job-card__company {
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--jv-text);
  }

  .job-card__tags {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    margin-top: 16px;
  }

  .job-card__tag {
    min-width: 5%;
    max-width: 30%;
    height: 24px;
    padding: 0 10px;
    overflow: hidden;
    font-size: 11px;
    border-radius: 6px;

    :deep(.el-tag__content) {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    --el-tag-bg-color: var(--jv-primary-soft);
    --el-tag-border-color: transparent;
    --el-tag-text-color: var(--jv-primary);
  }
}

// ---------- 页脚 ----------
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 18px;
  padding-bottom: 16px;
  margin-top: 32px;
  font-size: 10.5px;
  color: var(--jv-faint);
  border-top: 1px solid #dde8e6;

  .footer__left {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .footer__links {
    display: flex;
    align-items: center;
    gap: 26px;
  }

  .footer__link {
    font-size: 10.5px;

    --el-link-text-color: #78868f;
    --el-link-hover-text-color: var(--jv-primary);
  }

  @media (max-width: 1023.98px) {
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    .footer__left {
      gap: 16px;
    }
  }
}
</style>
