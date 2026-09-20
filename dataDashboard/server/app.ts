import cors from 'cors'
import express from 'express'
import { errorHandler, notFound } from './middleware/error'
import { apiRouter } from './routes'

export function createApp() {
  const app = express()

  app
  .use(cors())
  .use(express.json())
  .use('/api', apiRouter)

  // 错误中间件
  app.use(notFound).use(errorHandler)

  return app
}

