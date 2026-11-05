<!-- 城市输入框：支持手输 + 模糊匹配城市名的下拉建议 -->
<template>
  <el-autocomplete v-model="city" class="city-autocomplete" :placeholder="placeholder"
    :fetch-suggestions="searchCities" :trigger-on-focus="false" value-key="value" clearable @select="handleSelect"
    @clear="handleClear">
    <template #prefix>
      <el-icon>
        <Location />
      </el-icon>
    </template>
  </el-autocomplete>
</template>

<script setup lang="ts">
import { Location } from '@element-plus/icons-vue'

import { useCityStore } from '@/stores/city'

/** 城市建议项：value 字段供 el-autocomplete 的 value-key 使用 */
interface CityOption {
  label: string
  value: string
}

/** 最多展示的建议条数，避免一次渲染过多 */
const MAX_SUGGESTIONS = 20

withDefaults(defineProps<{
  /** 输入框占位文案 */
  placeholder?: string
}>(), {
  placeholder: '城市',
})

const emit = defineEmits<{
  /** 选中或清空城市时触发，方便父组件立即发起查询 */
  change: [value: string]
}>()

/** 当前城市名，空串表示不按城市筛选 */
const city = defineModel<string>({ default: '' })

const cityStore = useCityStore()

/** 模糊搜索：按输入内容做不区分大小写的子串匹配，空输入不展示建议 */
const searchCities = (query: string, callback: (items: CityOption[]) => void) => {
  const text = query.trim().toLowerCase()
  const matched = text
    ? cityStore.options.filter((item) => item.value.toLowerCase().includes(text)).slice(0, MAX_SUGGESTIONS)
    : []

  callback(matched)
}

/** 选中建议项：去掉首尾空格后回填，并通知父组件 */
const handleSelect = (item: CityOption) => {
  city.value = String(item.value ?? '').trim()
  emit('change', city.value)
}

/** 点清除按钮：同样通知父组件 */
const handleClear = () => {
  city.value = ''
  emit('change', '')
}

// 城市列表在 store 内缓存，多个页面共用一次请求
cityStore.fetchCities()
</script>

<style scoped>
.city-autocomplete {
  width: 100%;
}
</style>
