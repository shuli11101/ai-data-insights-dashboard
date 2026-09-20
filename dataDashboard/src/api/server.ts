import { request } from '../utils/request'

interface JobPosition {
  id: number
  jobName: string
  company: string
  minSalary: number
  maxSalary: number
  experience: string
  skillTags: string[]
}

export const getJobList = (params: { page: number; size: number }): Promise<{ list: JobPosition[], total: number }> => {
  return request<{ list: JobPosition[], total: number }>('/home/jobList', { params })
}
