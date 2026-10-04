<template>
  <!--
    AI 岗位洞察分析抽屉
  -->
  <el-drawer @close="closeDrawer" v-model="visible" class="ai-drawer" direction="rtl" :size="440" append-to-body
    :with-header="false" :modal="true" modal-penetrable :lock-scroll="false">
    <div class="ai-drawer__inner">
      <!-- 头部 -->
      <header class="ai-drawer__head">
        <svg class="ai-drawer__sparkle" width="20" height="20" viewBox="0 0 18 18" fill="none"
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
        <h2 class="ai-drawer__title">AI 岗位洞察分析</h2>
        <el-button class="ai-drawer__close" :icon="Close" aria-label="关闭" @click="closeDrawer" />
      </header>

      <!-- 内容区（高度不够时内部滚动） -->
      <div class="ai-drawer__content">
        <p class="ai-drawer__label">输入你的分析需求</p>
        <el-input v-model="prompt" class="ai-drawer__input" type="textarea" :rows="6" resize="none"
          placeholder="例如：帮我分析深圳 AI 岗位的薪资趋势与热门技能" />

        <!-- 开始分析按钮-->
        <el-button @click="startAnalysis" class="ai-drawer__submit" type="primary" :disabled="!prompt.trim || loading">
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
          开始分析
        </el-button>

        <!-- 报错提示 -->
        <p v-if="error" class="ai-drawer__error">{{ error }}</p>

        <div class="ai-drawer__result-head">
          <h3 class="ai-drawer__result-title">分析结果</h3>
          <span v-if="loading" class="ai-drawer__status">分析中…</span>
          <span v-else-if="resultItems.length" class="ai-drawer__status">就绪</span>
          <span v-else class="ai-drawer__unanalyzed">未分析</span>
        </div>

        <transition name="ai-result">
          <div v-show="resultItems.length" class="ai-drawer__panel">
            <section v-for="item in resultItems" :key="item.title" class="ai-drawer__item">
              <h4 class="ai-drawer__item-title">{{ item.title }}</h4>
              <p class="ai-drawer__item-text">{{ item.text }}</p>
            </section>
          </div>
        </transition>
      </div>

      <!-- 底部 -->
      <footer class="ai-drawer__foot">数据来源：全网 AI 招聘岗位 · 更新于 2026-09</footer>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, Transition } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { useAIStream } from '@/composables/useAIStream'

/**
 * 抽屉显隐
 * 默认打开；外部可通过 v-model 控制（打开/关闭的交互由页面自行实现）
 */
const visible = defineModel<boolean>({ default: true })

/** 分析需求输入 */
const prompt = ref('')

const { sections, loading, error, start, stop, reset } = useAIStream()

/** 分析结果：取小节正文，列表型小节合并为一行 */
const resultItems = computed(() =>
  sections.value.map((section) => ({
    title: section.title,
    text: section.text || section.items.join('、'),
  })),
)

// 点击开始分析按钮
const startAnalysis = () => {
  start({ scene: 'drawer', input: prompt.value })
}

// 关闭抽屉：立即中止请求（省 token），等关闭动画结束再清空内容
const closeDrawer = () => {
  visible.value = false
  stop()
  setTimeout(reset, 300)
}
</script>

<!--
  使用非 scoped 样式：el-drawer 通过 Teleport 挂到 body 下，
  scoped 的 :deep() 无法命中它渲染出来的 .el-drawer__body 等内部节点。
  这里所有类名都以 .ai-drawer 开头，不会污染全局。
-->
<style>
/* 抽屉 body 默认带 padding 且自身滚动，这里交给我们自己的结构来管理 */
.ai-drawer .el-drawer__body {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.ai-drawer__inner {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 头部 */
.ai-drawer__head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: 62px;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
}

.ai-drawer__sparkle {
  flex-shrink: 0;
  color: #4e9bf0;
}

.ai-drawer__title {
  flex: 1;
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}

.ai-drawer__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;

  --el-button-bg-color: #ffffff;
  --el-button-text-color: #64748b;
  --el-button-border-color: #e5e7eb;
  --el-button-hover-bg-color: #f9fafb;
  --el-button-hover-text-color: #1f2937;
  --el-button-hover-border-color: #d1d5db;
  --el-button-active-bg-color: #f3f4f6;
  --el-button-active-text-color: #1f2937;
  --el-button-active-border-color: #d1d5db;
}

/* 内容区 */
.ai-drawer__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px;
}

.ai-drawer__label {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 20px;
  color: #64748b;
}

.ai-drawer__input {
  --el-input-border-color: #e5e7eb;
  --el-input-hover-border-color: #d1d5db;
  --el-input-focus-border-color: #4e9bf0;
  --el-input-text-color: #1f2937;
  --el-textarea-placeholder-color: #94a3b8;
}

.ai-drawer__input .el-textarea__inner {
  padding: 12px;
  font-size: 14px;
  line-height: 22px;
  border-radius: 8px;
}

.ai-drawer__submit {
  width: 100%;
  height: 44px;
  margin-top: 16px;
  border-radius: 6px;
  font-size: 15px;

  --el-button-bg-color: #5680E9;
  --el-button-border-color: #5680E9;
  --el-button-hover-bg-color: #3e6ee8;
  --el-button-hover-border-color: #3e6ee8;
  --el-button-active-bg-color: #3e6ee8;
  --el-button-active-border-color: #3e6ee8;
}

.ai-drawer__submit svg {
  margin-right: 6px;
  vertical-align: middle;
}

/* 分析结果 */
.ai-drawer__result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 32px;
}

.ai-drawer__result-title {
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #1f2937;
}

.ai-drawer__status {
  font-size: 14px;
  line-height: 20px;
  color: #4e9bf0;
}

.ai-drawer__unanalyzed {
  color: #f11717;
  font-size: 14px;
  line-height: 20px;
}

/* ai分析结果内容 */
.ai-result-enter-active,
.ai-result-leave-active {
  transition: all 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.ai-result-enter-from,
.ai-result-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.ai-drawer__panel {
  margin-top: 16px;
  padding: 16px 20px;
  background: #eaf3fe;
  border-left: 3px solid #4e9bf0;
  border-radius: 8px;
}

.ai-drawer__item+.ai-drawer__item {
  margin-top: 16px;
}

.ai-drawer__item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: #1f2937;
}

.ai-drawer__item-text {
  margin: 2px 0 0;
  font-size: 14px;
  line-height: 22px;
  color: #475569;
}

/* 底部 */
.ai-drawer__foot {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  line-height: 18px;
  color: #94a3b8;
}

/* 分析结果报错 */
.ai-drawer__error {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 20px;
  color: #f11717;
}

/* 手机端：抽屉铺满整屏（宽度由 el-drawer 行内样式给出，需 !important 覆盖） */
@media (max-width: 599.98px) {
  .ai-drawer {
    width: 100% !important;
  }
}
</style>
