import { request } from '../utils/request'

/** 注册参数 */
export interface RegisterParams {
  phone: string
  code: string
  password: string
}

// 注册：手机号 + 验证码 + 密码，成功后返回 token
export const register = (body: RegisterParams): Promise<{ token: string }> => {
  return request<{ token: string }>('/auth/register', { method: 'post', data: body })
}

/** 登录参数 */
export interface LoginParams {
  phone: string
  password: string
}

// 登录：手机号 + 密码，成功后返回 token
export const login = (body: LoginParams): Promise<{ token: string }> => {
  return request<{ token: string }>('/auth/login', { method: 'post', data: body })
}

/** 当前登录用户的账号信息 */
export interface UserProfile {
  id: number
  phone: string
  nickname: string
  avatar: string
  currentJob: string
  location: string
  experience: string
  reportCount: number
  averageScore: number
  favoriteCount: number
}

// 获取当前登录用户信息（需 Authorization）
export const getUserProfile = (): Promise<UserProfile> => {
  return request<UserProfile>('/user/profile')
}

interface JobPosition {
  id: number
  job_name: string
  company: string
  salary_min: number
  salary_max: number
  experience: string
  skill_tags: string[]
}

/** 岗位详情：GET /home/jobDetail 返回的完整字段 */
export interface JobDetail extends JobPosition {
  city: string
  district: string | null
  publish_date: string | null
  created_at: string
  /** 当前登录用户是否已收藏；未登录固定为 false */
  favorited: boolean
}

export interface PersonalInfo {
  education: string
  experience: string
  skills: string[]
  city: string
  currentSalary: number | undefined
  expectedSalary: number | undefined
  /** 意向岗位名称 */
  jobTitle?: string
  /** 求职状态，如「在职，考虑机会」 */
  jobStatus?: string
}

/** 可更新的账号资料字段 */
export interface ProfileUpdate {
  nickname?: string
  avatar?: string
  currentJob?: string
  location?: string
}

// 更新账号资料（昵称 / 头像 / 目前职业 / 所在地），返回更新后的完整信息
export const updateUserProfile = (body: ProfileUpdate): Promise<UserProfile> => {
  return request<UserProfile>('/user/profile', { method: 'put', data: body })
}

// 上传头像：返回可直接用于 img src 的地址
export const uploadAvatar = (file: File): Promise<{ url: string }> => {
  const data = new FormData()
  data.append('file', file)
  return request<{ url: string }>('/user/avatar', { method: 'post', data })
}

// 获取岗位数据
export const getJobList = (params: { page: number; size: number, city: string, experienceMin: string, experienceMax: string, salaryMin: string, salaryMax: string, keyword: string, jobName: string }): Promise<{ list: JobPosition[], total: number }> => {
  return request<{ list: JobPosition[], total: number }>('/home/jobList', { params })
}

// 获取岗位详情（带合法 token 时额外返回 favorited）
export const getJobDetail = (id: number | string): Promise<JobDetail> => {
  return request<JobDetail>('/home/jobDetail', { params: { id } })
}

// 收藏岗位：返回 { added, favoriteCount }，重复收藏不会重复计数
export const addFavorite = (jobId: number): Promise<{ added: boolean, favoriteCount: number }> => {
  return request<{ added: boolean, favoriteCount: number }>('/user/favorite', { method: 'post', data: { jobId } })
}

// 取消收藏：返回 { removed, favoriteCount }
export const removeFavorite = (jobId: number): Promise<{ removed: boolean, favoriteCount: number }> => {
  return request<{ removed: boolean, favoriteCount: number }>('/user/favorite', {
    method: 'delete',
    params: { jobId },
  })
}

/** 已保存的岗位匹配报告 */
export interface MatchReport {
  score: number
  content: string
  updateTime: string
}

// 获取当前用户对某个岗位的匹配报告；没生成过会返回 404
export const getMatchReport = (jobId: number): Promise<MatchReport> => {
  return request<MatchReport>('/user/match-report', { params: { jobId } })
}

// 获取薪资分布数据
// 注意：后端 SQL 的列别名是 salary_range（下划线），不是 salaryRange
export const getSalaryRange = (): Promise<{ salary_range: string; jobCount: number }[]> => {
  return request<{ salary_range: string; jobCount: number }[]>('/home/salaryRange')
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
