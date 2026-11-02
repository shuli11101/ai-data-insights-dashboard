import cors from 'cors'
import express from 'express'
import { UPLOAD_DIR, ensureUploadDir } from './config/upload'
import { errorHandler, notFound } from './middleware/error'
import { apiRouter } from './routes'

export function createApp() {
  const app = express()

  ensureUploadDir()

  app
  .use(cors())
  // 放宽内存限制
  .use(express.json({ limit: '1mb' }))
  // 头像静态目录：放在 /api 下，前端开发代理可以一并转发
  .use('/api/uploads', express.static(UPLOAD_DIR))
   .use('/api', apiRouter)

  // 错误中间件
  app.use(notFound).use(errorHandler)

  return app
}

