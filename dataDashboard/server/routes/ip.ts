import { Router } from 'express'
import type { Request } from 'express'
import { requireAuth } from '../middleware/auth'
import { getPreference, hasPreference, savePreference } from '../services/user.service'

export const ipRouter = Router()

// 取客户端 IP：
// 1. 直连时用 socket 地址；
// 2. 经过 Nginx / 反向代理时，优先取 X-Forwarded-For 的第一段（最靠近客户端的一跳）。
// 注意 X-Forwarded-For 可被客户端伪造，正式环境建议在网关层覆盖该头，
// 或显式 app.set('trust proxy', '可信代理地址') 后改用 req.ip。
export function getClientIp(req: Request): string {
  const header = req.headers['x-forwarded-for']
  const forwarded = (Array.isArray(header) ? header[0] : header)?.split(',')[0]?.trim()
  const raw = forwarded || req.socket.remoteAddress || ''
  // IPv4 映射的 IPv6 地址（::ffff:192.168.1.10）统一还原成 IPv4
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw
}

// 获取当前请求的客户端 IP
ipRouter.get('/ip', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: { ip: getClientIp(req) },
  })
})

// 当前登录用户是否已填写求职意向，前端据此决定是否弹出问卷
ipRouter.get('/surveyStatus', requireAuth, async (req, res) => {
  const filled = await hasPreference(req.userId!)

  res.json({
    code: 0,
    message: 'success',
    data: { filled },
  })
})

// 获取当前登录用户的求职意向（未填写返回 null）
ipRouter.get('/getPersonal', requireAuth, async (req, res) => {
  const preference = await getPreference(req.userId!)

  res.json({
    code: 0,
    message: 'success',
    data: preference,
  })
})

// 保存当前登录用户的求职意向：一个用户一条，重复提交即更新
ipRouter.post('/setPersonalInfo', requireAuth, async (req, res) => {
  const result = await savePreference(req.userId!, req.body ?? {})

  if (!result.ok) {
    return res.status(result.status).json({
      code: 1,
      message: result.message,
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: result.data,
  })
})
