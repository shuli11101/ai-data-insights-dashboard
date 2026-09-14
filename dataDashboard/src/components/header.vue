<template>
  <header class="header">
    <div class="header__inner">
      <!-- 网页logo -->
      <div class="header__brand">
        <div class="header__logo">
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
        <h1 class="header__title">AI招聘数据洞察看板</h1>
      </div>

      <!-- 右侧操作按钮 -->
      <div class="header__actions">
        <!-- AI智能分析 -->
        <el-button @click="changeAnalysisVisible" class="header__aiAnalyse-btn" type="button">
          <svg class="header__aiAnalyse-icon" width="16" height="16" viewBox="0 0 18 18" fill="none"
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
          AI 分析
        </el-button>
        <!-- 切换暗黑模式按钮 -->
        <el-button class="header__theme-btn" type="button" aria-label="切换暗黑模式">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15.7387 9.3645C15.5429 12.9926 12.5103 15.8147 8.87746 15.7496C5.24464 15.6844 2.31522 12.7553 2.24965 9.12246C2.18409 5.48965 5.00589 2.45674 8.63399 2.2605C8.93774 2.244 9.09674 2.6055 8.93549 2.86275C7.82488 4.63969 8.08776 6.94804 9.56948 8.42976C11.0512 9.91148 13.3595 10.1744 15.1365 9.06375C15.3945 8.9025 15.7552 9.06075 15.7387 9.3645"
              stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </el-button>
      </div>
    </div>

    <!-- AI 岗位洞察分析抽屉（默认打开，内部 append-to-body 挂到 body 下） -->
    <AiAnalysisDrawer v-model="analysisVisible" />
  </header>
</template>
<script setup lang="ts">
import { ref } from 'vue'

import AiAnalysisDrawer from './ai-analysis-drawer.vue'

/** 抽屉显隐：默认关闭，交互（如点「AI 分析」按钮打开）待补充 */
const analysisVisible = ref(false)
const changeAnalysisVisible = () => {
  analysisVisible.value = !analysisVisible.value
}
</script>

<style scoped>
.header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #409eff;
}

.header__title {
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}


/* 右侧按钮组 */
.header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* AI 分析按钮图标：currentColor 取下面的品牌蓝 */
.header__aiAnalyse-icon {
  flex-shrink: 0;
  margin-right: 6px;
  color: #409eff;
}

.header__aiAnalyse-btn:hover {
  background: #f9fafb;
  color: #535353;
}

.header__theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
}

.header__theme-btn:hover {
  background: #f9fafb;
}
</style>
