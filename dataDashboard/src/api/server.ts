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

export interface PersonalInfo {
  education: string
  experience: string
  skills: string[]
  city: string
  currentSalary: number | undefined
  expectedSalary: number | undefined
}

// 获取岗位数据
export const getJobList = (params: { page: number; size: number, city: string, experienceMin: string, experienceMax: string, salaryMin: string, salaryMax: string, keyword: string, jobName: string }): Promise<{ list: JobPosition[], total: number }> => {
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
export const getCity = (): Promise<{ city: string }[]> => {
  return request<{ city: string }[]>('/home/city')
}

// 获取技术关键词
export const getKeywords = (): Promise<{ skill: string }[]> => {
  return request<{ skill: string }[]>('/home/keywords')
}

// 获取客户端 IP（浏览器读不到本机 IP，由服务端根据请求来源返回）
export const getClientIp = (): Promise<{ ip: string }> => {
  return request<{ ip: string }>('/ip')
}
// 判断当前 IP 是否已填写过问卷（服务端按请求来源判断，无需前端传 IP）
export const getSurveyStatus = (): Promise<{ filled: boolean }> => {
  return request<{ filled: boolean }>('/surveyStatus')
}
// 将用户基础信息存入数据库（ip 由服务端从请求中获取，无需前端传）
export const setPersonalInfo = (body: PersonalInfo): Promise<{ id: string }> => {
  return request<{ id: string }>('/setPersonalInfo', { method: 'post', data: body })
}
// 获取当前 IP 已提交的个人信息，用于表单回显（未提交过返回 null）
export const getPersonal = (): Promise<PersonalInfo | null> => {
  return request<PersonalInfo | null>('/getPersonal')
}
