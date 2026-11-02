<template>
  <div class="layout">
    <!-- 顶部导航：原左侧导航栏功能已迁移到这里 -->
    <Header :avatar="avatar" :nickname="nickname" class="layout__header" />

    <main class="layout__main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './header.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 获取用户信息
const { avatar, nickname } = userStore.profile || {}
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
}
</style>
