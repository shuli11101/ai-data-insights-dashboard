import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getPersonal, setPersonalInfo, type PersonalInfo } from '@/api/server'

// 个人信息全局状态：服务端按请求 IP 返回该 IP 已提交的信息
export const usePersonalInfoStore = defineStore('personalInfo', () => {
  // 已提交的个人信息；null 表示当前 IP 没填写过
  const info = ref<PersonalInfo | null>(null)
  // 是否已向服务端确认过：用来区分「未填写」和「还没查」
  const loaded = ref(false)

  // 是否填写过（判据就是 info 是否存在，不需要再调 surveyStatus）
  const filled = computed(() => info.value !== null)

  // 拼成给 AI 的补充信息：未填写的字段省略；未填写过返回空串
  const context = computed(() => {
    const item = info.value
    if (!item) return ''
    const lines: string[] = []
    if (item.city) lines.push(`意向城市：${item.city}`)
    if (item.experience) lines.push(`工作经验：${item.experience}`)
    if (item.skills.length) lines.push(`掌握技能：${item.skills.join('、')}`)
    if (item.education) lines.push(`目前学历：${item.education}`)
    if (item.currentSalary != null) lines.push(`目前月薪：${item.currentSalary} 元`)
    if (item.expectedSalary != null) lines.push(`期望月薪：${item.expectedSalary} 元`)
    return lines.length ? `求职者个人信息：\n${lines.join('\n')}` : ''
  })

  // 获取个人信息：已确认过则命中缓存，force 为 true 时强制刷新
  const fetchPersonal = async (force = false) => {
    if (loaded.value && !force) return info.value
    try {
      info.value = await getPersonal()
    } finally {
      // 请求失败也要标记为已确认，否则页面会一直停在加载态
      loaded.value = true
    }
    return info.value
  }

  // 提交个人信息，并重新拉取一次，保证全局状态与服务端一致
  const submitPersonal = async (payload: PersonalInfo) => {
    await setPersonalInfo(payload)
    await fetchPersonal(true)
  }

  return { info, loaded, filled, context, fetchPersonal, submitPersonal }
})
