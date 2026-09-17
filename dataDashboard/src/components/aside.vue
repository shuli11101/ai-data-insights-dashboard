<template>
  <!--
    左侧导航栏（Figma node 24-4）
    收起后只留图标，宽度由 el-menu 的 collapse 控制（64px）
  -->
  <aside class="aside" :class="{ 'aside--collapsed': props.collapsed }">
    <!-- logo部分 -->
    <div class="aside__brand">
      <div class="aside__logo">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.26275 2.1105C8.32905 1.75553 8.63889 1.4982 9 1.4982C9.36111 1.4982 9.67095 1.75553 9.73725 2.1105L10.5255 6.279C10.6401 6.88551 11.1145 7.35993 11.721 7.4745L15.8895 8.26275C16.2445 8.32905 16.5018 8.63889 16.5018 9C16.5018 9.36111 16.2445 9.67095 15.8895 9.73725L11.721 10.5255C11.1145 10.6401 10.6401 11.1145 10.5255 11.721L9.73725 15.8895C9.67095 16.2445 9.36111 16.5018 9 16.5018C8.63889 16.5018 8.32905 16.2445 8.26275 15.8895L7.4745 11.721C7.35993 11.1145 6.88551 10.6401 6.279 10.5255L2.1105 9.73725C1.75553 9.67095 1.4982 9.36111 1.4982 9C1.4982 8.63889 1.75553 8.32905 2.1105 8.26275L6.279 7.4745C6.88551 7.35993 7.35993 6.88551 7.4745 6.279L8.26275 2.1105"
            stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M15 1.5V4.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M16.5 3H13.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path
            d="M1.5 15C1.5 15.8279 2.17213 16.5 3 16.5C3.82787 16.5 4.5 15.8279 4.5 15C4.5 14.1721 3.82787 13.5 3 13.5C2.17213 13.5 1.5 14.1721 1.5 15H1.5"
            stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h1 class="aside__title">AI招聘数据洞察看板</h1>
    </div>

    <!-- 导航菜单：暂只放「首页」一项 -->
    <el-menu class="aside__menu" :collapse="props.collapsed" :collapse-transition="false" :default-active="route.path"
      router>
      <el-menu-item class="aside__menu-item" index="/">
        <el-icon>
          <HomeFilled />
        </el-icon>
        <template #title>
          <span>首页</span>
        </template>
      </el-menu-item>
      <el-menu-item class="aside__menu-item" index="/ai-analyse">
        <svg class="aiAnalyse-icon" width="16" height="16" viewBox="0 0 18 18" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.26275 2.1105C8.32905 1.75553 8.63889 1.4982 9 1.4982C9.36111 1.4982 9.67095 1.75553 9.73725 2.1105L10.5255 6.279C10.6401 6.88551 11.1145 7.35993 11.721 7.4745L15.8895 8.26275C16.2445 8.32905 16.5018 8.63889 16.5018 9C16.5018 9.36111 16.2445 9.67095 15.8895 9.73725L11.721 10.5255C11.1145 10.6401 10.6401 11.1145 10.5255 11.721L9.73725 15.8895C9.67095 16.2445 9.36111 16.5018 9 16.5018C8.63889 16.5018 8.32905 16.2445 8.26275 15.8895L7.4745 11.721C7.35993 11.1145 6.88551 10.6401 6.279 10.5255L2.1105 9.73725C1.75553 9.67095 1.4982 9.36111 1.4982 9C1.4982 8.63889 1.75553 8.32905 2.1105 8.26275L6.279 7.4745C6.88551 7.35993 7.35993 6.88551 7.4745 6.279L8.26275 2.1105"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M15 1.5V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round" />
          <path d="M16.5 3H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round" />
          <path
            d="M1.5 15C1.5 15.8279 2.17213 16.5 3 16.5C3.82787 16.5 4.5 15.8279 4.5 15C4.5 14.1721 3.82787 13.5 3 13.5C2.17213 13.5 1.5 14.1721 1.5 15H1.5"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <template #title>
          <span>AI 分析</span>
        </template>
      </el-menu-item>
      <el-menu-item class="aside__menu-item" index="/about">
        <el-icon>
          <Document />
        </el-icon>
        <template #title>
          <span>About</span>
        </template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { HomeFilled, Document } from '@element-plus/icons-vue'

/** 侧边栏是否收起（收起后只留图标） */
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
</script>

<style scoped>
.aside {
  /* 收起宽度：.aside--collapsed 和 el-menu 的 collapse 宽度共用，保证两者始终一致 */
  --aside-collapsed-width: 64px;
  /* 菜单项的水平内边距：EP 用它算展开态的 padding-left，也用它给收起态的图标定位，
     想让菜单项离左侧更近/更远，只改这一个值即可 */
  --el-menu-base-level-padding: 10px;

  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 240px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  transition: width 0.2s ease;
}

.aside--collapsed {
  width: var(--aside-collapsed-width);
}

/* el-menu 自带的收起宽度是 calc(--el-menu-icon-width + --el-menu-base-level-padding * 2)，
   上面把内边距改小后它会跟着缩水（与 .aside--collapsed 对不上），所以钉回同一个值 */
.aside__menu.el-menu--collapse {
  width: var(--aside-collapsed-width);
}

/* 品牌区：左右 padding 取 15px，收起后 logo 恰好落在 64px 宽的中心（15 + 34 + 15），
   因此收起时 logo 位置不变，无需切换 justify-content（它不可动画，会瞬间跳变） */
.aside__brand {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  height: 60px;
  padding: 0 15px;
  overflow: hidden;
}

.aside__logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #409eff;
}

/* 标题 */
.aside__title {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: #1f2937;
  white-space: nowrap;
}

/* 导航 */
.aside__menu {
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: none;

  --el-menu-bg-color: transparent;
  --el-menu-text-color: #475569;
  --el-menu-active-color: #409eff;
  --el-menu-hover-bg-color: #f8fafc;
  --el-menu-item-height: 40px;
}

.aside__menu :deep(.el-menu-item) {
  padding-left: 0;
  margin-bottom: 4px;
  border-radius: 8px;
}

/* 选中项：Element Plus 默认只改文字色，这里补上底色 */
.aside__menu :deep(.el-menu-item.is-active) {
  background: #eaf3fe;
  font-weight: 500;
}

/* AI 分析是自绘 svg，EP 的图标盒与间距规则（只作用于 .el-icon）拿不到，这里显式给左右间距。
   注意收起态：EP 会把 #title 挪进 tooltip，svg 后面不再有兄弟元素，
   此时 margin-right 不改变任何位置（没有东西可推），只有 margin-left 会把图标往右挪 */
.aiAnalyse-icon {
  flex-shrink: 0;
  margin: 0 5px;
}

/* 收起 / 展开 */
.aside__foot {
  flex-shrink: 0;
  padding: 12px 8px;
  border-top: 1px solid #e5e7eb;
}

.aside__toggle {
  gap: 6px;
  width: 100%;
  height: 36px;
  padding: 0;
  color: #64748b;

  --el-button-hover-bg-color: #f8fafc;
  --el-button-hover-text-color: #1f2937;
  --el-button-active-bg-color: #f1f5f9;
  --el-button-active-text-color: #1f2937;
}
</style>
