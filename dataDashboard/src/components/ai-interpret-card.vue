<template>
  <!--
    AI 智能解读浮层（Figma node 20-635）
    固定定位的浮动卡片：position: fixed + top/left，便于后续跟随表格行点击的位置
  -->
  <transition name="ai-interpret-fade">
    <div v-show="visible" class="ai-interpret" :style="{ top: `${top}px`, left: `${left}px` }">
      <!-- 头部 -->
      <header class="ai-interpret__head">
        <div class="ai-interpret__logo">
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="18" width="30" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="4" />
            <circle cx="17" cy="26" r="2" fill="currentColor" />
            <circle cx="31" cy="26" r="2" fill="currentColor" />
            <path
              d="M20 32C18.8954 32 18 32.8954 18 34C18 35.1046 18.8954 36 20 36V32ZM28 36C29.1046 36 30 35.1046 30 34C30 32.8954 29.1046 32 28 32V36ZM20 36H28V32H20V36Z"
              fill="currentColor" />
            <path d="M24 10V18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M4 26V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M44 26V34" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="24" cy="8" r="2" stroke="currentColor" stroke-width="4" />
          </svg>
        </div>
        <h2 class="ai-interpret__title">AI 智能解读</h2>
        <el-button class="ai-interpret__close" link :icon="Close" aria-label="关闭" @click="visible = false" />
      </header>

      <!-- 输入区 -->
      <p class="ai-interpret__label">输入你的分析需求</p>
      <div class="ai-interpret__row">
        <el-input v-model="prompt" class="ai-interpret__input" placeholder="例如：分析深圳大模型岗位的薪资" />
        <el-button class="ai-interpret__submit" type="primary">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          AI 解读
        </el-button>
      </div>

      <!-- 结构化结果 -->
      <section class="ai-interpret__panel">
        <div class="ai-interpret__panel-head">
          <h3 class="ai-interpret__panel-title">
            <el-icon class="ai-interpret__panel-icon">
              <List />
            </el-icon>
            <span>结构化结果</span>
          </h3>
          <span class="ai-interpret__status">就绪</span>
        </div>

        <div class="ai-interpret__result">
          <div class="ai-interpret__score">
            <span class="ai-interpret__score-label">匹配度</span>
            <span class="ai-interpret__score-value">86</span>
          </div>
          <p class="ai-interpret__line">优势：{{ searchJobData.skillTags.join('、') || '无' }}
          </p>
          <p class="ai-interpret__line">建议：需AI生成</p>
        </div>
      </section>

      <!-- 底部 -->
      <p class="ai-interpret__foot">数据来源：全网 AI 招聘岗位 · 更新于 2026-09</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close, List } from '@element-plus/icons-vue'

interface Props {
  /** 浮层距视口顶部距离（px），跟随表格行点击时由调用方计算 */
  top?: number
  /** 浮层距视口左侧距离（px） */
  left?: number
  // 数据
  searchJobData: {
    id: number
    company: string
    minSalary: number
    maxSalary: number
    experience: string
    skillTags: string[]
  }
}

// 获取数据
const { top = 160, left = 1000, searchJobData } = defineProps<Props>()

/** 浮层显隐：默认显示；外部可通过 v-model 控制 */
const visible = defineModel<boolean>({ default: true })

/** 分析需求输入 */
const prompt = ref('')
</script>

<style scoped>
/* 浮层显隐过渡 */
.ai-interpret-fade-enter-active,
.ai-interpret-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.ai-interpret-fade-enter-from,
.ai-interpret-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.ai-interpret-fade-leave-active {
  pointer-events: none;
}


.ai-interpret {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  width: 420px;
  max-width: calc(100vw - 24px);
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow:
    0 12px 32px 0 rgba(15, 23, 42, 0.12),
    0 2px 6px 0 rgba(15, 23, 42, 0.06);
}

/* 头部 */
.ai-interpret__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-interpret__logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #4e9bf0;
  color: #ffffff;
}

.ai-interpret__title {
  flex: 1;
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}

.ai-interpret__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 16px;

  --el-button-text-color: #94a3b8;
  --el-button-hover-text-color: #475569;
  --el-button-active-text-color: #1f2937;
}

/* 输入区 */
.ai-interpret__label {
  margin: 16px 0 8px;
  font-size: 14px;
  line-height: 20px;
  color: #64748b;
}

.ai-interpret__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-interpret__input {
  flex: 1;
  min-width: 0;

  --el-input-height: 44px;
  --el-input-border-radius: 8px;
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #d1d5db;
  --el-input-focus-border-color: #4e9bf0;
  --el-input-text-color: #1f2937;
}

.ai-interpret__input :deep(.el-input__inner) {
  font-size: 14px;
}

.ai-interpret__submit {
  flex-shrink: 0;
  height: 44px;
  padding: 0 16px;
  border-radius: 8px;

  --el-button-bg-color: #4e9bf0;
  --el-button-border-color: #4e9bf0;
  --el-button-hover-bg-color: #3d8ae0;
  --el-button-hover-border-color: #3d8ae0;
  --el-button-active-bg-color: #3583d8;
  --el-button-active-border-color: #3583d8;
}

.ai-interpret__submit svg {
  margin-right: 6px;
  vertical-align: middle;
}

/* 结构化结果面板 */
.ai-interpret__panel {
  margin-top: 20px;
  padding: 16px;
  background: #eaf3fe;
  border-radius: 12px;
}

.ai-interpret__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-interpret__panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #1f2937;
}

.ai-interpret__panel-icon {
  font-size: 16px;
  color: #4e9bf0;
}

.ai-interpret__status {
  font-size: 14px;
  line-height: 20px;
  color: #4e9bf0;
}

.ai-interpret__result {
  margin-top: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

.ai-interpret__score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-interpret__score-label {
  font-size: 13px;
  line-height: 20px;
  color: #4e9bf0;
}

.ai-interpret__score-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  color: #4e9bf0;
}

.ai-interpret__line {
  display: flex;
  margin: 0;
  font-size: 14px;
  line-height: 28px;
  color: #334155;
}

.ai-interpret__score+.ai-interpret__line {
  margin-top: 12px;
}

/* 底部 */
.ai-interpret__foot {
  margin: 20px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: #94a3b8;
}
</style>
