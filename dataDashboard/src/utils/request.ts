import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

const service = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

// 响应拦截器：统一剥壳 + 统一错误信息
service.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    // 业务码非 0 也走 reject，这样调用方只需要 try/catch 一种处理方式
    if (body.code !== 0) {
      return Promise.reject(new Error(body.message))
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(new Error('请求超时，请稍后重试'))
    }
    // 后端返回 4xx/5xx 时，错误信息在 error.response.data 里
    const message = error.response?.data?.message ?? '网络异常，请稍后重试'
    return Promise.reject(new Error(message))
  },
)

/** 统一请求入口：返回值已剥掉 { code, message, data } 外壳 */
export async function request<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await service.request<ApiResponse<T>>({ url, ...config })
  return response.data.data
}
