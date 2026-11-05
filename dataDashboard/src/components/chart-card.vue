<!-- 卡片外观 + 卡片标题，图标区域 -->
<template>
  <el-card class="chart-card" shadow="never" :style="{ height: `${props.height ?? 300}px` }">
    <div class="chart-card__header">
      <h3 class="chart-card__title">{{ title }}</h3>
      <p class="chart-card__subtitle">{{ subtitle }}</p>
    </div>
    <!-- 图表容器：留空，后续放 ECharts 实例 -->
    <div class="chart-card__body">
      <slot />
    </div>
  </el-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** 卡片标题 */
  title: string
  /** 卡片副标题 / 图表说明 */
  subtitle?: string
  /** 卡片总高度，默认 300px；侧边栏等紧凑场景可传更小的值 */
  height?: number
}>()
</script>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  --el-card-border-color: #e5e7eb;
  --el-card-border-radius: 16px;
  --el-card-padding: 16px 18px;

  box-shadow:
    0 1px 3px 0 rgba(15, 23, 42, 0.03),
    0 1px 2px 0 rgba(15, 23, 42, 0.04);
}

/* 让 el-card 的内容区跟着卡片高度撑满，图表区才能用 flex 占剩余高度 */
.chart-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chart-card__header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
}

.chart-card__title {
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #1f2937;
}

.chart-card__subtitle {
  margin: 0;
  font-family: 'WenQuanYi Zen Hei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #64748b;
}

/* 图表区占满卡片剩余高度，ECharts 初始化依赖确定高度 */
.chart-card__body {
  flex: 1;
  min-height: 0;
}
</style>
