<template>
  <div class="layout" :class="{ 'layout--immersive': immersive }">
    <!-- 沉浸模式：全局导航默认收起，鼠标进入页面顶部区域时浮出 -->
    <template v-if="immersive">
      <div class="layout__top-trigger" :class="{ 'is-hidden': headerVisible }">
        <button type="button" class="layout__handle" aria-label="显示顶部导航" @click="revealHeader">
          <span class="layout__handle-bar"></span>
          <el-icon class="layout__handle-chevron">
            <ArrowDown />
          </el-icon>
        </button>
      </div>

      <Header :avatar="avatar" :nickname="nickname" class="layout__floating-header header--immersive"
        :class="{ 'is-visible': headerVisible }" />
    </template>

    <Header v-else :avatar="avatar" :nickname="nickname" class="layout__header" />

    <main class="layout__main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'

import { useUserStore } from '@/stores/user'

import Header from './header.vue'

const userStore = useUserStore()

// 获取用户信息
const { avatar, nickname } = userStore.profile || {}

const route = useRoute()

/** 当前页面是否启用沉浸模式（由路由 meta 控制） */
const immersive = computed(() => route.meta.immersive === true)

/** 全局导航是否展开 */
const headerVisible = ref(false)

/** 顶部触发区高度：鼠标进入这一区域就展开导航 */
const HEADER_TRIGGER_HEIGHT = 24

const revealHeader = () => {
  if (immersive.value) headerVisible.value = true
}

/**
 * 用全局 mousemove 统一管理展开与收起：
 * - 鼠标贴近顶部时展开
 * - 鼠标在导航或其下拉浮层上时保持展开
 * - 移到页面其它区域时收起
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!immersive.value) return

  // 鼠标停在顶部触发区（导航还在下滑动画中）时不收起
  if (event.clientY <= HEADER_TRIGGER_HEIGHT) {
    headerVisible.value = true
    return
  }

  if (!headerVisible.value) return

  // 下拉菜单通过 Teleport 挂到 body 下，需要一并放行，否则操作下拉时导航会先收起来。
  // 用 Element 而不是 HTMLElement 判断，图标里的 SVG 节点也能命中 closest。
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('.layout__floating-header, .el-popper')) return

  headerVisible.value = false
}

/** 触屏设备没有 mousemove，点击页面空白处时也要能收起导航 */
const handleDocumentClick = (event: MouseEvent) => {
  if (!immersive.value || !headerVisible.value) return

  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('.layout__floating-header, .el-popper, .layout__handle')) return

  headerVisible.value = false
}

// 切换页面时重置，避免导航悬浮层带到下一个页面
watch(
  () => route.fullPath,
  () => {
    headerVisible.value = false
  },
)

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .layout__header {
    flex-shrink: 0;
  }

  .layout__main {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  /* ---------- 沉浸模式 ---------- */
  &.layout--immersive {
    .layout__main {
      // 页面内部自己管理滚动，避免和浮层导航一起出现双滚动条
      overflow: hidden;
    }
  }

  .layout__floating-header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 100;
    // 默认藏在视口上方，鼠标到顶部时再滑出
    visibility: hidden;
    transform: translateY(-100%);
    transition:
      transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1),
      visibility 0s linear 0.26s;
    will-change: transform;

    &.is-visible {
      visibility: visible;
      transform: translateY(0);
      transition:
        transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1),
        visibility 0s;
    }
  }

  .layout__top-trigger {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 90;
    display: flex;
    justify-content: center;
    height: 24px;
    // 不遮挡页面内容，只有中间的小把手可以交互
    pointer-events: none;
    transition: opacity 0.18s ease;

    &.is-hidden {
      visibility: hidden;
      opacity: 0;

      .layout__handle {
        pointer-events: none;
      }
    }
  }

  .layout__handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    width: 72px;
    padding: 8px 0 0;
    color: #afc5c0;
    cursor: pointer;
    pointer-events: auto;
    background: transparent;
    border: 0;
    transition: opacity 0.18s ease;

    &:hover {
      opacity: 0.7;
    }
  }

  .layout__handle-bar {
    width: 48px;
    height: 4px;
    background: #d3e1de;
    border-radius: 2px;
  }

  .layout__handle-chevron {
    font-size: 10px;
  }
}
</style>
