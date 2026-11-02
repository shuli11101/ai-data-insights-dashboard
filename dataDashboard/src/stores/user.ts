import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getUserProfile, type UserProfile } from '@/api/server'

/** 用户信息的本地缓存键：刷新页面后从缓存恢复 */
const PROFILE_KEY = 'jobvision_profile'

/** 读取本地缓存的用户信息 */
const readCachedProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

// 登录用户信息：登录成功后拉取，供顶部导航等位置使用
export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(readCachedProfile())

  // 拉取当前登录用户信息，并写入本地缓存
  const fetchProfile = async () => {
    const data = await getUserProfile()
    profile.value = data
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
    return data
  }

  // 退出登录时清空
  const clearProfile = () => {
    profile.value = null
    localStorage.removeItem(PROFILE_KEY)
  }

  return { profile, fetchProfile, clearProfile }
})
