<template>
  <div class="layout">
    <!-- 左侧导航栏 -->
    <Aside :collapsed="collapsed" class="layout__aside" />

    <!-- 右侧：顶栏 + 内容 -->
    <div class="layout__content">
      <Header v-model:collapsed="collapsed" class="layout__header" />

      <main class="layout__main">
        <router-view></router-view>
      </main>
    </div>

    <!-- 底部栏 -->
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

import Header from './header.vue'
import Aside from './aside.vue'

// 侧边栏展开/收起
const collapsed = ref(false)
</script>

<style scoped>
.layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.layout__aside {
  flex-shrink: 0;
  height: 100%;
}

.layout__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.layout__header {
  max-height: 60px;
  flex-shrink: 0;
}

.layout__main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
