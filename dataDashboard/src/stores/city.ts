import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getCity } from '@/api/server'

// 城市字典全局状态：首页搜索、个人信息、问卷等多处共用，统一缓存一份
export const useCityStore = defineStore('city', () => {
  // 岗位城市列表（后端 DISTINCT city 去重），空数组表示还没拉到或请求失败
  const list = ref<string[]>([])
  // 是否已成功拉取过，避免每个页面进来都重复请求
  const loaded = ref(false)
  // 顶部城市选择器当前选中的城市，空串表示「全国」
  const current = ref('')
  // 进行中的请求：并发调用共用同一个 Promise，防止同时发出多次
  let pending: Promise<string[]> | null = null

  // el-select 需要的 { label, value } 结构
  const options = computed(() => list.value.map((city) => ({ label: city, value: city })))

  // 设置当前城市：空串即「全国」，不做城市筛选
  const setCurrent = (city: string) => {
    current.value = city.trim()
  }

  /**
   * 拉取城市列表，默认命中缓存直接返回；force 为 true 时强制重新请求。
   * 失败时吞掉异常并返回当前缓存（空数组），下次调用会重试。
   */
  const fetchCities = async (force = false): Promise<string[]> => {
    if (loaded.value && !force) return list.value
    if (pending) return pending

    pending = getCity()
      .then((res) => {
        list.value = res.map((item) => item.city)
        loaded.value = true
        return list.value
      })
      .catch((error) => {
        console.log('获取城市列表失败：', error)
        return list.value
      })
      .finally(() => {
        pending = null
      })

    return pending
  }

  return { list, loaded, current, options, fetchCities, setCurrent }
})
