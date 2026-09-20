import { Router } from 'express'
import { ping } from '../services/health.service'

// 随时自动补货异常并转交到中间件
export const healthRouter = Router()

healthRouter.get('/health', async (_req, res) => {
 await ping()
 res.status(200).json({
  code : 0 ,
   message : 'ok' ,
   data : { db : 'up' } })
})
