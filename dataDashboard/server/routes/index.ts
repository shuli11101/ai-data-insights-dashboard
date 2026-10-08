import { healthRouter } from './health'
import { homeRouter } from './home'
import { aiRouter } from './ai'
import { ipRouter } from './ip'

import { Router } from 'express'

// 连接接口
export const apiRouter = Router()
apiRouter.use(healthRouter)
apiRouter.use(ipRouter)
apiRouter.use('/home', homeRouter)
apiRouter.use('/ai', aiRouter)
