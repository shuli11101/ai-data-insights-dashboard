import { healthRouter } from './health'
import { homeRouter } from './home'

import { Router } from 'express'

// 连接接口
export const apiRouter = Router()
apiRouter.use(healthRouter)
apiRouter.use('/home', homeRouter)
