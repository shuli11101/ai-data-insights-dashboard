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

      <!-- 城市（静态展示，后续接入城市切换） -->
      <el-button text class="header__location" :icon="Location">
        上海
        <el-icon class="header__location-chevron">
          <ArrowDown />
        </el-icon>
      </el-button>

      <!-- 导航：原侧边栏的几项功能 -->
      <el-menu class="header__menu" mode="horizontal" :default-active="route.path" :ellipsis="false" router>
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">{{ item.label }}</el-menu-item>
      </el-menu>

      <!-- 右侧：快捷分析 + 用户 -->
      <div class="header__actions">
        <el-button class="header__analyze" :icon="Plus" @click="changeAnalysisVisible">分析岗位</el-button>

        <span class="header__divider"></span>

        <!-- 已登录：用户下拉菜单 -->
        <el-dropdown v-if="isLoggedIn" class="header__user-dropdown" trigger="click" popper-class="header-user-menu"
          @command="handleUserCommand">
          <span class="header__user">
            <div v-if="avatar"></div>
            <el-avatar v-else :size="32" class="header__avatar">{{ nickname.slice(0, 1) }}</el-avatar>
            <span class="header__username">{{ nickname }}</span>
            <el-icon class="header__chevron">
              <ArrowDown />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录：登录 / 注册入口 -->
        <nav v-else class="header__auth">
          <router-link to="/login" class="header__auth-link">登录</router-link>
          <router-link to="/register" class="header__auth-link header__auth-link--primary">注册</router-link>
        </nav>
      </div>
    </div>

    <!-- AI 岗位洞察分析抽屉（默认关闭，内部 append-to-body 挂到 body 下） -->
    <AiAnalysisDrawer v-model="analysisVisible" />
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ArrowDown, Location, Plus, SwitchButton } from '@element-plus/icons-vue'

import { usePersonalInfoStore } from '@/stores/personalInfo'
import { useUserStore } from '@/stores/user'
import { getToken, removeToken } from '@/utils/token'

import AiAnalysisDrawer from './ai-analysis-drawer.vue'

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

/** 是否已登录：本地有 token 或已缓存用户信息即视为登录 */
const isLoggedIn = computed(() => Boolean(getToken()) || Boolean(userStore.profile))

/** 优先用外部传入的头像/昵称，没有则回退到本地缓存的用户信息 */
const avatar = computed(() => props.avatar || userStore.profile?.avatar || '')
const nickname = computed(() => props.nickname || userStore.profile?.nickname || '用户')

/** 用户下拉菜单：当前只有退出 */
const handleUserCommand = (command: string | number | object) => {
  if (command !== 'logout') return

  removeToken()
  userStore.clearProfile()
  personalInfoStore.reset()
  router.push('/login')
}

/** 抽屉显隐：点「分析岗位」打开 */
const analysisVisible = ref(false)
const changeAnalysisVisible = () => {
  analysisVisible.value = !analysisVisible.value
}
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

  .header__analyze {
    height: 38px;
    padding: 0 15px;
    font-size: 12.5px;
    font-weight: 600;
    border-radius: 10px;

    --el-button-text-color: #007c77;
    --el-button-bg-color: #ffffff;
    --el-button-border-color: #cfe1dd;
    --el-button-hover-text-color: #007c77;
    --el-button-hover-bg-color: #f3faf8;
    --el-button-hover-border-color: #cfe1dd;
    --el-button-active-text-color: #007c77;
    --el-button-active-bg-color: #f3faf8;
    --el-button-active-border-color: #cfe1dd;
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
</style>

<style lang="scss">
// 下拉菜单挂在 body 下，脱离 scoped 作用域，用独立的全局样式块
.header-user-menu {
  min-width: 160px;

  .el-dropdown-menu {
    padding: 6px;
  }

  .el-dropdown-menu__item {
    height: 42px;
    padding: 0 12px;
    font-size: 13px;
    color: #f56c6c;
    border-radius: 8px;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    .el-icon {
      margin-right: 8px;
      font-size: 15px;
      color: #f56c6c;
    }

    &:not(.is-disabled):hover,
    &:not(.is-disabled):focus {
      color: #f56c6c;
      background: #fef0f0;
    }
  }
}
</style>
