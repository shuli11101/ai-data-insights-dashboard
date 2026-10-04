import { request } from '../utils/request'

interface JobPosition {
  id: number
  job_name: string
  company: string
  salary_min: number
  salary_max: number
  experience: string
  skill_tags: string[]
}

// 获取岗位数据
export const getJobList = (params: { page: number; size: number, city: string, experience: string, salary: string, keyword: string }): Promise<{ list: JobPosition[], total: number }> => {
  return request<{ list: JobPosition[], total: number }>('/home/jobList', { params })
}

// 获取薪资分布数据
export const getSalaryRange = (): Promise<{ salaryRange: string; jobCount: number }[]> => {
  return request<{ salaryRange: string; jobCount: number }[]>('/home/salaryRange')
}

// 获取技术栈热度数据
export const getSkillTags = (): Promise<{ skill_tag: string; hot_count: number }[]> => {
  return request<{ skill_tag: string; hot_count: number }[]>('/home/skillTags')
}

// 获取地方岗位数量数据
export const getDistrict = (): Promise<{ area_name: string; job_count: number }[]> => {
  return request<{ area_name: string; job_count: number }[]>('/home/district')
}

// 获取工作经验对应平均薪资数据
export const getExperienceSalary = (): Promise<{ experience: string; avg_salary: number }[]> => {
  return request<{ experience: string; avg_salary: number }[]>('/home/experienceSalary')
}

// 获取城市数据
export const getCity = (): Promise<{ district: string }[]> => {
  return request<{ district: string }[]>('/home/city')
}

// 获取技术关键词
export const getKeywords = (): Promise<{ skill: string }[]> => {
  return request<{ skill: string }[]>('/home/keywords')
}
