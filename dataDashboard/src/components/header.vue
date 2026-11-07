<template>
  <header class="header">
    <div class="header__inner">
      <!-- 品牌 -->
      <router-link to="/" class="header__brand">
        <span class="header__logo">
          <svg width="22" height="22" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M10.5 24.6v-4.4M16.1 24.6V15.9M21.7 24.6V11.4" stroke="#DFF7F4" stroke-width="2.7"
              stroke-linecap="round" />
            <circle cx="28.2" cy="9.2" r="3.3" fill="#00BEBD" stroke="#E7F7F5" stroke-width="1.2" />
          </svg>
        </span>
        <span class="header__title">JobVision</span>
      </router-link>

      <!-- 城市：点击展开城市选择面板 -->
      <el-popover v-model:visible="cityPopoverVisible" placement="bottom-start" trigger="click" :width="720"
        :offset="10" popper-class="header-city-popper">
        <template #reference>
          <el-button text class="header__location" :icon="Location">
            {{ cityStore.current || '全国' }}
            <el-icon class="header__location-chevron">
              <ArrowDown />
            </el-icon>
          </el-button>
        </template>

        <CityPicker :current="cityStore.current" @select="handleSelectCity" />
      </el-popover>

      <!-- 导航：原侧边栏的几项功能 -->
      <el-menu class="header__menu" mode="horizontal" :default-active="route.path" :ellipsis="false" router>
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">{{ item.label }}</el-menu-item>
      </el-menu>

      <!-- 右侧：快捷聊天 + 用户 -->
      <div class="header__actions">
        <!-- 云朵气泡：轮播闲聊引导，点一下进入 AI 对话，悬停时暂停轮播 -->
        <div class="header__chat">
          <button type="button" class="chat-cloud" @click="goAiChat" @mouseenter="stopTipLoop"
            @mouseleave="startTipLoop">
            <transition name="tip-fade" mode="out-in">
              <span :key="tipIndex" class="chat-cloud__inner">
                <span class="chat-cloud__title">{{ currentTip.title }}</span>
                <span class="chat-cloud__desc">{{ currentTip.desc }}</span>
              </span>
            </transition>
          </button>

          <el-button round class="header__analyze" :icon="ChatDotRound" @click="goAiChat">AI 聊天</el-button>


        </div>

        <span class="header__divider"></span>

        <!-- 已登录：用户下拉菜单 -->
        <el-dropdown ref="dropdownRef" v-if="isLoggedIn" class="header__user-dropdown" trigger="click"
          popper-class="header-user-menu" @visible-change="handleDropdownVisible">
          <span class="header__user">
            <div v-if="avatar"></div>
            <el-avatar v-else :size="32" class="header__avatar">{{ nickname.slice(0, 1) }}</el-avatar>
            <span class="header__username">{{ nickname }}</span>
            <el-icon class="header__chevron">
              <ArrowDown />
            </el-icon>
          </span>

          <template #dropdown>
            <div class="user-menu">
              <!-- 匹配概览：平均匹配分 + 半圆进度 -->
              <section class="user-menu__score">
                <div class="score__info">
                  <header class="score__head">
                    <span class="score__label">平均匹配</span>
                  </header>
                  <strong class="score__value">{{ averageText }}</strong>
                </div>

                <svg class="score__gauge" viewBox="0 0 60 34" aria-hidden="true">
                  <path class="score__gauge-track" d="M8 30 A22 22 0 0 1 52 30" pathLength="100" />
                  <path class="score__gauge-value" d="M8 30 A22 22 0 0 1 52 30" pathLength="100"
                    :stroke-dashoffset="gaugeOffset" />
                </svg>
              </section>

              <!-- 统计与入口 -->
              <div class="user-menu__rows">
                <button type="button" class="user-menu__row user-menu__row--action"
                  @click="handleUserCommand('reports')">
                  <span class="user-menu__icon">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path
                        d="M9.5 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V6.5L9.5 1.5Z" />
                      <path d="M9.5 1.5V5a1.5 1.5 0 0 0 1.5 1.5h2" />
                      <path d="M5.5 8h5M5.5 10.5h3.5" />
                    </svg>
                  </span>
                  <span class="user-menu__label">分析报告</span>
                  <span class="user-menu__value">{{ reportCountText }}</span>
                  <span class="user-menu__chevron">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" aria-hidden="true">
                      <path d="m5.5 3 5 5-5 5" />
                    </svg>
                  </span>
                </button>

                <button type="button" class="user-menu__row user-menu__row--action"
                  @click="handleUserCommand('favorites')">
                  <span class="user-menu__icon">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path
                        d="M4 2.5A1.5 1.5 0 0 1 5.5 1h5A1.5 1.5 0 0 1 12 2.5v11.2a.5.5 0 0 1-.77.42L8 11.6l-3.23 2.5A.5.5 0 0 1 4 13.7V2.5Z" />
                    </svg>
                  </span>
                  <span class="user-menu__label">收藏职位</span>
                  <span class="user-menu__value">{{ favoriteCountText }}</span>
                  <span class="user-menu__chevron">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" aria-hidden="true">
                      <path d="m5.5 3 5 5-5 5" />
                    </svg>
                  </span>
                </button>

                <button type="button" class="user-menu__row user-menu__row--action"
                  @click="handleUserCommand('agreement')">
                  <span class="user-menu__icon">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M8 1.5 13 3v4.4c0 3.1-2 5.6-5 7.1-3-1.5-5-4-5-7.1V3L8 1.5Z" />
                      <path d="M5.8 8.2 7.3 9.7l3-3" />
                    </svg>
                  </span>
                  <span class="user-menu__label">用户隐私协议</span>
                  <span class="user-menu__chevron">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" aria-hidden="true">
                      <path d="m5.5 3 5 5-5 5" />
                    </svg>
                  </span>
                </button>
              </div>

              <div class="user-menu__divider"></div>

              <button type="button" class="user-menu__logout" @click="handleUserCommand('logout')">
                <span class="user-menu__icon">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M6.5 2.5H4A1.5 1.5 0 0 0 2.5 4v8A1.5 1.5 0 0 0 4 13.5h2.5" />
                    <path d="M10 5.5 12.5 8 10 10.5M12.5 8H6" />
                  </svg>
                </span>
                <span>退出</span>
              </button>
            </div>
          </template>
        </el-dropdown>

        <!-- 未登录：登录 / 注册入口 -->
        <nav v-else class="header__auth">
          <router-link to="/login" class="header__auth-link">登录</router-link>
          <router-link to="/register" class="header__auth-link header__auth-link--primary">注册</router-link>
        </nav>
      </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ArrowDown, ChatDotRound, Location } from '@element-plus/icons-vue'

import { listConversations } from '@/api/conversation'
import { getFavoriteList, getMatchReportList } from '@/api/server'
import { useCityStore } from '@/stores/city'
import { usePersonalInfoStore } from '@/stores/personalInfo'
import { useUserStore } from '@/stores/user'
import { parseSections, sectionNumber } from '@/utils/aiText'
import { getToken, removeToken } from '@/utils/token'

import CityPicker from './city-picker.vue'

const props = defineProps({
  avatar: {
    type: String,
    default: '',
  },
  nickname: {
    type: String,
    default: '',
  },
})

/** 顶部导航：由原左侧导航栏迁移而来 */
const navItems = [
  { label: '首页', path: '/' },
  { label: 'AI 分析', path: '/ai-analyse' },
  { label: '个人信息', path: '/personal-info' },
  { label: 'About', path: '/about' },
]

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const personalInfoStore = usePersonalInfoStore()
const cityStore = useCityStore()

/** 城市面板显隐 */
const cityPopoverVisible = ref(false)

/** 选择城市：空串代表「全国」，选完收起面板 */
const handleSelectCity = (city: string) => {
  cityStore.setCurrent(city)
  cityPopoverVisible.value = false
}

// 城市列表在 store 内缓存，多个页面共用一次请求
cityStore.fetchCities()

/** 是否已登录：本地有 token 或已缓存用户信息即视为登录 */
const isLoggedIn = computed(() => Boolean(getToken()) || Boolean(userStore.profile))

/** 优先用外部传入的头像/昵称，没有则回退到本地缓存的用户信息 */
const avatar = computed(() => props.avatar || userStore.profile?.avatar || '')
const nickname = computed(() => props.nickname || userStore.profile?.nickname || '用户')

/** 用户下拉菜单实例，点击入口后手动收起 */
const dropdownRef = ref<{ handleClose: () => void }>()

/** 下拉菜单统计：报告数 / 收藏数 / 平均匹配分 */
const reportTotal = ref<number | null>(null)
const favoriteTotal = ref<number | null>(null)
const averageScore = ref(0)
let statsLoading = false

const clampScore = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

const averageText = computed(() => (reportTotal.value ? `${averageScore.value}%` : '—'))
const reportCountText = computed(() => (reportTotal.value === null ? '—' : `${reportTotal.value} 份`))
const favoriteCountText = computed(() => (favoriteTotal.value === null ? '—' : `${favoriteTotal.value} 个`))

/** 半圆进度条的剩余长度：pathLength 归一化为 100，偏移量即未完成比例 */
const gaugeOffset = computed(() => 100 - (reportTotal.value ? averageScore.value : 0))

/** 下拉菜单每次展开时刷新统计，失败不提示、保持占位 */
const loadStats = async () => {
  if (!getToken() || statsLoading) return

  statsLoading = true
  try {
    const [reports, favorites, conversations] = await Promise.all([
      getMatchReportList(),
      getFavoriteList(),
      listConversations(50),
    ])

    // 分析报告 = 已保存的岗位匹配报告 + 技术栈 / JD 分析会话（列表接口最多返回 50 条）
    const analysisRows = conversations.filter((item) => item.scene === 'skill' || item.scene === 'jd')
    reportTotal.value = reports.total + analysisRows.length
    favoriteTotal.value = favorites.total

    // 平均匹配分：匹配报告分数 + 技术栈分析会话里的匹配度评分
    const skillScores = analysisRows
      .filter((item) => item.scene === 'skill')
      .map((item) => sectionNumber(parseSections(item.lastMessage || ''), '匹配度评分'))
      .filter((score) => score > 0)
    const scores = [...reports.list.map((item) => clampScore(item.score)), ...skillScores]

    averageScore.value = scores.length
      ? clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0
  } catch {
    // 统计接口失败不影响退出登录等操作
  } finally {
    statsLoading = false
  }
}

const handleDropdownVisible = (visible: boolean) => {
  if (visible) loadStats()
}

/** 用户下拉菜单：分析报告 / 收藏职位 / 用户隐私协议 / 退出登录 */
const handleUserCommand = (command: 'reports' | 'favorites' | 'agreement' | 'logout') => {
  dropdownRef.value?.handleClose()

  if (command === 'reports') {
    router.push('/reports')
    return
  }

  if (command === 'favorites') {
    router.push('/favorites')
    return
  }

  if (command === 'agreement') {
    router.push('/agreement')
    return
  }

  removeToken()
  userStore.clearProfile()
  personalInfoStore.reset()

  // 退出后清空统计，避免下次登录展示旧数据
  reportTotal.value = null
  favoriteTotal.value = null

  router.push('/login')
}

/** 进入 AI 分析的「AI 对话」模式 */
const goAiChat = () => {
  router.push({ path: '/ai-analyse', query: { mode: '3' } })
}

/** 云朵气泡里的引导文案，定时轮播 */
const CHAT_TIPS = [
  { title: '今天想聊啥?', desc: '点我，随便聊两句' },
  { title: '最近怎么样?', desc: '点我，唠两句' },
  { title: '最近在找机会?', desc: '点我，聊聊方向' },
  { title: '简历要不要改改?', desc: '点我，一起看看' },
  { title: '有啥想吐槽的?', desc: '点我，我听着' },
  { title: '工作还顺心吗?', desc: '点我，聊聊' },
]

/** 轮播间隔（毫秒） */
const TIP_INTERVAL = 4000

const tipIndex = ref(0)
const currentTip = computed(() => CHAT_TIPS[tipIndex.value]!)

let tipTimer: ReturnType<typeof setInterval> | null = null

/** 停止轮播：清理定时器，可重复调用 */
const stopTipLoop = () => {
  if (tipTimer) {
    clearInterval(tipTimer)
    tipTimer = null
  }
}

/** 开始轮播：按顺序循环切换文案，到末尾回到第一条 */
const startTipLoop = () => {
  stopTipLoop()
  tipTimer = setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % CHAT_TIPS.length
  }, TIP_INTERVAL)
}

onMounted(startTipLoop)
onBeforeUnmount(stopTipLoop)
</script>

<style scoped lang="scss">
.header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e2ebe9;

  .header__inner {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    max-width: 1280px;
    height: 52px;
    padding: 0 40px;
    margin: 0 auto;
  }

  // ---------- 品牌 ----------
  .header__brand {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 12px;
    text-decoration: none;
  }

  .header__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #007c77;
    border-radius: 11px;
  }

  .header__title {
    font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.8px;
    color: #17252b;
  }

  // ---------- 城市 ----------
  .header__location {
    flex-shrink: 0;
    height: auto;
    padding: 0;
    margin-left: 44px;
    font-family: inherit;
    font-size: 13px;

    --el-button-text-color: #3d4b54;
    --el-button-hover-text-color: #007c77;
    --el-button-hover-bg-color: transparent;
    --el-button-active-bg-color: transparent;
    // text 按钮的 hover/active 背景走 fill 变量，一并去掉灰底
    --el-fill-color-light: transparent;
    --el-fill-color: transparent;

    .header__location-chevron {
      margin-left: 6px;
      color: #7d8d94;
    }
  }

  // ---------- 导航 ----------
  .header__menu {
    flex: 0 1 auto;
    height: 100%;
    min-width: 0;
    margin-left: 26px;
    overflow-x: auto;
    border-bottom: none;
    scrollbar-width: none;

    --el-menu-bg-color: transparent;
    --el-menu-text-color: #65747c;
    --el-menu-active-color: #007c77;
    --el-menu-hover-text-color: #007c77;
    --el-menu-hover-bg-color: transparent;

    &::-webkit-scrollbar {
      display: none;
    }

    :deep(.el-menu-item) {
      height: 100%;
      padding: 0;
      margin: 0 14px;
      font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 14px;
      line-height: 1;
      border-bottom: none;
    }

    :deep(.el-menu-item:last-child) {
      margin-right: 0;
    }

    :deep(.el-menu-item:hover) {
      background: transparent;
    }

    :deep(.el-menu-item.is-active) {
      position: relative;
      font-weight: 600;
      background: transparent;
      // EP 横向菜单默认给选中项整条 2px 下划线，这里压掉，改用 32px 短下划线
      border-bottom: none !important;
    }

    :deep(.el-menu-item.is-active::after) {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 32px;
      height: 2px;
      content: '';
      background: #007c77;
      border-radius: 1px;
      transform: translateX(-50%);
    }
  }

  // ---------- 右侧操作 ----------
  .header__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 16px;
    margin-left: auto;
  }

  // AI 聊天按钮 + 云朵气泡
  .header__chat {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 10px;
  }

  // 胶囊形按钮，渐变底，和原来的描边方按钮区分开
  .header__analyze {
    flex-shrink: 0;
    height: 36px;
    padding: 0 16px;
    font-size: 12.5px;
    font-weight: 600;
    background: linear-gradient(135deg, #007c77 0%, #00b5b0 100%);
    border: none;
    border-radius: 999px;
    transition:
      box-shadow 0.2s ease,
      background 0.2s ease;

    --el-button-text-color: #ffffff;
    --el-button-bg-color: transparent;
    --el-button-border-color: transparent;
    --el-button-hover-text-color: #ffffff;
    --el-button-hover-bg-color: transparent;
    --el-button-hover-border-color: transparent;
    --el-button-active-text-color: #ffffff;
    --el-button-active-bg-color: transparent;
    --el-button-active-border-color: transparent;

    &:hover {
      background: linear-gradient(135deg, #006b66 0%, #00a5a0 100%);
      box-shadow: 0 4px 12px rgba(0, 124, 119, 0.24);
    }
  }

  // 云朵气泡：胶囊主体 + 两团圆角拼接，filter 让整体投影连成一片
  .chat-cloud {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: flex-start;
    padding: 6px 14px 7px;
    font: inherit;
    text-align: left;
    cursor: pointer;
    background: #ffffff;
    border: 0;
    border-radius: 999px;
    filter: drop-shadow(0 4px 10px rgba(11, 60, 57, 0.1));
    transition: transform 0.18s ease;

    &::before,
    &::after {
      position: absolute;
      content: '';
      background: #ffffff;
      border-radius: 50%;
    }

    // 右上角轻微鼓出，更像云朵
    &::after {
      bottom: -5px;
      right: 8px;
      width: 12px;
      height: 12px;
    }

    &:hover {
      transform: translateY(-1px);
    }
  }

  .chat-cloud__inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .chat-cloud__title {
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.4;
    color: #17252b;
    white-space: nowrap;
  }

  .chat-cloud__desc {
    font-size: 9.5px;
    line-height: 1.3;
    color: #78868f;
    white-space: nowrap;
  }

  .header__divider {
    width: 1px;
    height: 16px;
    background: #e3ebec;
  }

  .header__user-dropdown {
    display: flex;
    align-items: center;
  }

  .header__user {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    cursor: pointer;
  }

  .header__avatar {
    font-size: 13px;
    font-weight: 600;

    --el-avatar-bg-color: #e8f7f4;
    --el-avatar-text-color: #007c77;

    border: 1px solid #d3eae6;
  }

  .header__username {
    font-size: 13px;
    color: #3d4b54;
  }

  .header__chevron {
    color: #7d8d94;
  }

  // ---------- 未登录：登录 / 注册 ----------
  .header__auth {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header__auth-link {
    padding: 0 12px;
    font-size: 13px;
    line-height: 30px;
    color: #3d4b54;
    text-decoration: none;
    border-radius: 8px;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      color: #007c77;
    }
  }

  .header__auth-link--primary {
    color: #007c77;
    background: #f2faf8;
    border: 1px solid #cfe1dd;

    &:hover {
      color: #007c77;
      background: #e8f7f4;
      border-color: #b9dad5;
    }
  }

  // ---------- 沉浸模式：作为悬浮层覆盖在页面顶部 ----------
  &.header--immersive {
    box-shadow: 0 10px 14px rgba(11, 60, 57, 0.12);

    .header__inner {
      height: 52px;
    }

    // 下划线与普通页保持一致贴在导航底部，只保留更宽的宽度
    :deep(.el-menu-item.is-active::after) {
      width: 44px;
    }

    @media (max-width: 640px) {
      .header__inner {
        height: 64px;
      }
    }
  }

  // ---------- 响应式 ----------
  @media (max-width: 1199.98px) {
    .header__inner {
      padding: 0 24px;
    }

    .header__location {
      margin-left: 28px;
    }

    // 中等宽度先收起云朵，避免挤压导航
    .chat-cloud {
      display: none;
    }

    .header__menu {
      margin-left: 14px;

      :deep(.el-menu-item) {
        margin: 0 11px;
      }
    }
  }

  @media (max-width: 1023.98px) {
    .header__inner {
      padding: 0 20px;
    }

    .header__location,
    .header__username {
      display: none;
    }

    .header__menu {
      margin-left: 16px;

      :deep(.el-menu-item) {
        margin: 0 9px;
        font-size: 13px;
      }

      :deep(.el-menu-item.is-active::after) {
        width: 24px;
      }
    }
  }

  @media (max-width: 640px) {
    .header__inner {
      height: 64px;
      padding: 0 16px;
    }

    .header__logo {
      width: 32px;
      height: 32px;
      border-radius: 9px;
    }

    .header__title {
      font-size: 18px;
    }

    .header__menu {
      margin-left: 8px;

      :deep(.el-menu-item) {
        margin: 0 7px;
        font-size: 12.5px;
      }
    }

    .header__analyze {
      height: 34px;
      padding: 0 10px;
      font-size: 12px;
    }

    .header__divider {
      display: none;
    }
  }
}

/* 云朵文案轮播的淡入淡出 */
.tip-fade-enter-active,
.tip-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.tip-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<style lang="scss">
// 城市选择面板同样挂在 body 下，需要单独写全局样式
.header-city-popper {
  padding: 18px 20px 20px;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(11, 60, 57, 0.12);
}

// 下拉菜单挂在 body 下，脱离 scoped 作用域，用独立的全局样式块
.header-user-menu.el-dropdown__popper {
  padding: 0;
  background: #ffffff;
  border: 1px solid #dde8e6;
  border-radius: 14px;
  box-shadow: 0 10px 32px rgba(23, 37, 43, 0.1);

  // 设计稿没有气泡箭头
  .el-popper__arrow {
    display: none;
  }
}

.header-user-menu {
  .user-menu {
    box-sizing: border-box;
    width: 200px;
    padding: 16px;
  }

  // ---------- 匹配概览 ----------
  .user-menu__score {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 14px;
    background: #f3f9f7;
    border-radius: 12px;
  }

  .score__info {
    min-width: 0;
  }

  .score__head {
    display: flex;
    align-items: center;
  }

  .score__label {
    font-size: 11.5px;
    font-weight: 600;
    color: #65747c;
  }

  .score__value {
    display: block;
    margin-top: 4px;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.6px;
    color: #17252b;
  }

  // 半圆环形进度：轨道 + 按分数填充的弧
  .score__gauge {
    flex-shrink: 0;
    width: 60px;
    height: 34px;
  }

  .score__gauge-track {
    fill: none;
    stroke: #dcefea;
    stroke-width: 5;
  }

  .score__gauge-value {
    fill: none;
    stroke: #007c77;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 100;
    transition: stroke-dashoffset 0.6s ease;
  }

  // ---------- 统计行 ----------
  .user-menu__rows {
    padding: 8px 0 2px;
  }

  .user-menu__row {
    display: flex;
    gap: 10px;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 44px;
    padding: 0 6px;
    font: inherit;
    text-align: left;
    background: none;
    border: 0;
    border-radius: 8px;
  }

  .user-menu__row--action {
    cursor: pointer;
    transition: background-color 0.18s ease;

    &:hover {
      background: #f3f9f7;
    }
  }

  .user-menu__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 15px;
    color: #007c77;
  }

  .user-menu__label {
    flex: 1;
    font-size: 13px;
    color: #3d4b54;
  }

  .user-menu__value {
    font-size: 12.5px;
    font-weight: 600;
    color: #17252b;
  }

  .user-menu__chevron {
    display: flex;
    align-items: center;
    color: #8a979e;
  }

  .user-menu__divider {
    height: 1px;
    margin: 6px 0;
    background: #edf2f2;
  }

  // ---------- 退出 ----------
  .user-menu__logout {
    display: flex;
    gap: 10px;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 44px;
    padding: 0 6px;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #e05a4f;
    text-align: left;
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: 8px;
    transition: background-color 0.18s ease;

    .user-menu__icon {
      color: #e05a4f;
    }

    &:hover {
      background: #fef0f0;
    }
  }
}
</style>
