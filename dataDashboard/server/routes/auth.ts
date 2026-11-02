import { Router } from 'express'
import { loginUser, registerUser } from '../services/auth.service'

export const authRouter = Router()

/**
 * 注册：手机号 + 验证码 + 密码
 * POST /api/auth/register
 * { "phone": "13800138000", "code": "123456", "password": "abc12345" }
 * 成功返回 { code, message, data: { token } }
 */
authRouter.post('/register', async (req, res) => {
  const result = await registerUser(req.body ?? {})

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

/**
 * 登录：手机号 + 密码
 * POST /api/auth/login
 * { "phone": "13800138000", "password": "abc12345" }
 * 成功返回 { code, message, data: { token } }
 */
authRouter.post('/login', async (req, res) => {
  const result = await loginUser(req.body ?? {})

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
