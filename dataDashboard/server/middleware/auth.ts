import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../services/auth.service'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** 由 requireAuth 注入的当前登录用户 ID */
      userId?: number
    }
  }
}

/** 校验 Authorization: Bearer <token>；不通过直接 401，通过后把 userId 挂到请求上 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    res.status(401).json({
      code: 1,
      message: '请先登录',
    })
    return
  }

  req.userId = payload.sub
  next()
}

/**
 * 可选登录：带合法 token 时挂上 userId，没带或 token 无效也放行。
 * 用于「登录后返回更多字段、未登录也能看」的公开接口。
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const payload = token ? verifyToken(token) : null

  if (payload) req.userId = payload.sub
  next()
}
