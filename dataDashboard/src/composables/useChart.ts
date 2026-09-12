import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * 把一个 div 变成 ECharts 图表容器，自动处理实例创建、尺寸自适应和销毁。
 * 内部用到 onMounted / onBeforeUnmount，必须在 setup 顶层同步调用。
 *
 * @param option ECharts 配置
 * @returns 容器 ref，绑定到模板中承载图表的 div 上
 */
export const useChart = (option: EChartsOption): Ref<HTMLDivElement | null> => {
  const chartEl = ref<HTMLDivElement | null>(null)
  let chartInstance: echarts.EChartsType | null = null
  let chartObserver: ResizeObserver | null = null

  onMounted(() => {
    if (!chartEl.value) return

    chartInstance = echarts.init(chartEl.value)
    chartInstance.setOption(option)

    // 卡片宽度随栅格列数变化，监听容器尺寸让图表自适应
    chartObserver = new ResizeObserver(() => chartInstance?.resize())
    chartObserver.observe(chartEl.value)
  })

  // 组件卸载前释放图表实例，避免内存泄漏
  onBeforeUnmount(() => {
    chartObserver?.disconnect()
    chartInstance?.dispose()
  })

  return chartEl
}
