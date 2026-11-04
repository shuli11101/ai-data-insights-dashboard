<template>
  <!-- 右侧栏：求职意向 / 最近分析 / 求职建议 -->
  <el-card shadow="never" class="side" :class="{ 'side--guest': !isLoggedIn, 'side--empty': isLoggedIn && !hasData }">
    <!-- 未登录：引导登录 -->
    <div v-if="!isLoggedIn" class="side__guest">
      <div class="side__guest-content">
        <h3 class="side__guest-title">登录后查看求职数据</h3>
        <p class="side__guest-desc">登录后，这里会展示你的求职意向、最近分析和求职建议。</p>
        <div class="side__guest-actions">
          <el-button type="primary" class="side__guest-btn" @click="goLogin">登录</el-button>
          <el-button link class="side__link" @click="goRegister">还没有账号？注册</el-button>
        </div>
      </div>
    </div>

    <!-- 已登录且已填写个人信息 -->
    <template v-else-if="hasData">
      <section class="side__section">
        <span class="side__label">求职意向</span>
        <div class="side__intent-row">
          <h3 class="side__intent">前端开发工程师</h3>
          <el-button link class="side__link">编辑</el-button>
        </div>
        <p class="side__intent-desc">上海 · 3–5 年 · 20–30K</p>
      </section>

      <section class="side__section">
        <div class="side__row">
          <h4 class="side__subtitle">最近分析</h4>
          <el-button link class="side__link">全部 7 份</el-button>
        </div>
        <div v-for="item in recentAnalyses" :key="item.title + item.company" class="analysis">
          <div class="analysis__info">
            <p class="analysis__title">{{ item.title }}</p>
            <p class="analysis__desc">{{ item.company }} · 匹配分析</p>
          </div>
          <span class="analysis__score">{{ item.score }}%</span>
        </div>
      </section>

      <section class="side__section">
        <span class="side__label">求职建议</span>
        <blockquote class="advice">
          <p class="advice__title">把「熟悉」和「精通」分开看。</p>
          <p class="advice__desc">程度词，往往决定面试的深度。</p>
        </blockquote>
        <el-button link class="side__link advice__link">查看岗位分析</el-button>
      </section>
    </template>

    <!-- 已登录但未填写个人信息：沿用个人页的空态样式 -->
    <div v-else-if="personalInfoStore.loaded" class="side__empty">
      <div class="side__empty-content">
        <h3 class="side__empty-title">还没有求职数据</h3>
        <p class="side__empty-desc">填写个人基础信息后，这里会展示求职意向、最近分析和求职建议。</p>
        <el-button class="side__empty-btn" type="primary" @click="goPersonalInfo">去填写</el-button>
      </div>
    </div>

    <!-- 首次请求返回前先占位，避免闪空态 -->
    <div v-else v-loading="true" class="side__loading"></div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { usePersonalInfoStore } from '@/stores/personalInfo'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/token'

/** 最近分析条目 */
interface RecentAnalysis {
  title: string
  company: string
  score: number
}

const recentAnalyses: RecentAnalysis[] = [
  { title: '高级前端工程师', company: '星野科技', score: 86 },
  { title: '前端开发工程师', company: '云图智能', score: 72 },
]

const personalInfoStore = usePersonalInfoStore()
const userStore = useUserStore()
const router = useRouter()

/** 是否已登录：本地有 token 或已缓存用户信息即视为登录 */
const isLoggedIn = computed(() => Boolean(getToken()) || Boolean(userStore.profile))

/** 是否已有求职数据：以是否填写过个人信息为准 */
const hasData = computed(() => personalInfoStore.loaded && personalInfoStore.filled)

const goLogin = () => router.push('/login')
const goRegister = () => router.push('/register')
const goPersonalInfo = () => router.push('/personal-info')
</script>

<style scoped lang="scss">
.side {
  align-self: start;
  border-radius: 16px;

  --el-card-border-color: var(--jv-border);
  --el-card-border-radius: 16px;
  --el-card-padding: 24px 28px;

  .side__section + .side__section {
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid var(--jv-line);
  }

  .side__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: #78868f;
  }

  .side__intent-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
  }

  .side__intent {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.3px;
  }

  .side__intent-desc {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: var(--jv-muted);
  }

  .side__link {
    flex-shrink: 0;
    height: auto;
    padding: 0;
    font-size: 11.5px;
    font-weight: 500;

    --el-button-text-color: var(--jv-primary);
    --el-button-hover-link-text-color: #006b66;
    --el-button-active-color: #006b66;
  }

  .side__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .side__subtitle {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  /* 已登录但未填写个人信息：与个人页空态同款渐变 + 模糊光斑 */
  &.side--empty {
    position: relative;
    min-height: 360px;
    overflow: hidden;
    background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #ecfeff 100%);

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.65;
    }

    &::before {
      top: -60px;
      left: 12%;
      width: 220px;
      height: 220px;
      background: #a5b4fc;
    }

    &::after {
      right: 10%;
      bottom: -80px;
      width: 240px;
      height: 240px;
      background: #67e8f9;
    }
  }

  /* 未登录：换成暖色渐变，和已登录的空态区分开 */
  &.side--guest {
    position: relative;
    min-height: 360px;
    overflow: hidden;
    background: linear-gradient(135deg, #fff4e5 0%, #fdf7f2 55%, #fff1f3 100%);

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.6;
    }

    &::before {
      top: -60px;
      left: 12%;
      width: 220px;
      height: 220px;
      background: #fdba74;
    }

    &::after {
      right: 10%;
      bottom: -80px;
      width: 240px;
      height: 240px;
      background: #fda4af;
    }
  }

  .side__empty,
  .side__guest {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 310px;
  }

  .side__empty-content,
  .side__guest-content {
    padding: 0 8px;
    text-align: center;
  }

  .side__empty-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .side__empty-desc {
    margin: 8px 0 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: #64748b;
  }

  .side__empty-btn {
    margin-top: 20px;
    background: #6774fe;
    border-color: #6774fe;

    &:hover {
      background: #4f60f9;
      border-color: #4f60f9;
    }
  }

  .side__guest-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #8a4b16;
  }

  .side__guest-desc {
    margin: 8px 0 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: #a16207;
  }

  .side__guest-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
  }

  .side__guest-btn {
    background: #007c77;
    border-color: #007c77;

    &:hover {
      background: #006b66;
      border-color: #006b66;
    }
  }

  .side__loading {
    min-height: 310px;
  }

  @media (max-width: 1023.98px) {
    --el-card-padding: 20px 22px;
  }
}

.analysis {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--jv-line);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  .analysis__title {
    margin: 0;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--jv-ink);
  }

  .analysis__desc {
    margin: 4px 0 0;
    font-size: 10.5px;
    color: var(--jv-faint);
  }

  .analysis__score {
    flex-shrink: 0;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.4px;
    color: var(--jv-primary);
  }
}

.advice {
  padding: 2px 0 2px 14px;
  margin: 12px 0 0;
  border-left: 2px solid #a8d8d0;

  .advice__title {
    margin: 0;
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.5;
  }

  .advice__desc {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: #4f6068;
  }

  .advice__link {
    margin-top: 16px;
  }
}
</style>
