<template>
  <div class="layout">
    <!-- 顶部栏 -->
    <Header class="layout__header" />

    <!-- 中间内容 -->
    <main class="layout__main">
      <router-view></router-view>
    </main>

    <!-- 底部栏 -->
  </div>
</template>
<script setup lang="ts">
import Header from './header.vue'
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.layout__header {
  flex-shrink: 0;
}

.layout__main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
