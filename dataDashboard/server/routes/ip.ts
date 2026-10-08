import { Router } from 'express'
import type { Request } from 'express'
import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import pool from '../config/db'

export const ipRouter = Router()

// 取客户端 IP：
// 1. 直连时用 socket 地址；
// 2. 经过 Nginx / 反向代理时，优先取 X-Forwarded-For 的第一段（最靠近客户端的一跳）。
// 注意 X-Forwarded-For 可被客户端伪造，正式环境建议在网关层覆盖该头，
// 或显式 app.set('trust proxy', '可信代理地址') 后改用 req.ip。
function getClientIp(req: Request): string {
  const header = req.headers['x-forwarded-for']
  const forwarded = (Array.isArray(header) ? header[0] : header)?.split(',')[0]?.trim()
  const raw = forwarded || req.socket.remoteAddress || ''
  // IPv4 映射的 IPv6 地址（::ffff:192.168.1.10）统一还原成 IPv4
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw
}

// el-input 取到的是字符串，统一转成数字；空值/非法值存 null，避免 INT 列报错
function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

// 获取当前请求的客户端 IP
ipRouter.get('/ip', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: { ip: getClientIp(req) },
  })
})

// 判断当前 IP 是否已填写过问卷，前端据此决定是否渲染问卷弹窗
ipRouter.get('/surveyStatus', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM user_survey WHERE ip = ? LIMIT 1',
    [getClientIp(req)],
  )

  res.json({
    code: 0,
    message: 'success',
    data: { filled: rows.length > 0 },
  })
})

// 根据ip获取用户个人信息
ipRouter.get('/getPersonal', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT education, experience, skill_tags, city, current_salary, expect_salary
     FROM user_survey
     WHERE ip = ?
     ORDER BY create_time DESC
     LIMIT 1`,
    [getClientIp(req)],
  )

  const row = rows[0]

  res.json({
    code: 0,
    message: 'success',
    // 字段名与前端表单保持一致；skill_tags 是 JSON 列，mysql2 已自动解析成数组
    data: row
      ? {
        education: row.education ?? '',
        experience: row.experience ?? '',
        skills: row.skill_tags ?? [],
        city: row.city ?? '',
        currentSalary: row.current_salary ?? undefined,
        expectedSalary: row.expect_salary ?? undefined,
      }
      : null,
  })
})

// 将用户基础信息存入数据库
ipRouter.post('/setPersonalInfo', async (req, res) => {
  const { education, experience, skills, city, currentSalary, expectedSalary } = req.body ?? {}

  // 与前端 rules 保持一致：工作经验、意向城市、拥有技术为必填
  if (!experience || !city || !Array.isArray(skills) || skills.length === 0) {
    res.status(400).json({
      code: 1,
      message: '工作经验、意向城市、拥有技术为必填项',
    })
    return
  }

  // IP 一律取服务端看到的来源地址，不信任前端传值
  const ip = getClientIp(req)

  const values = [
    education || null,
    experience,
    JSON.stringify(skills),
    city,
    toNumberOrNull(currentSalary),
    toNumberOrNull(expectedSalary),
  ]

  // 一个 IP 只保留一条记录：已存在则更新，不存在才插入
  const [existed] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM user_survey WHERE ip = ? ',
    [ip],
  )

  if (existed.length > 0) {
    await pool.query(
      `UPDATE user_survey
      SET education = ?, experience = ?, skill_tags = ?, city = ?, current_salary = ?, expect_salary = ?
      WHERE ip = ?`,
      [...values, ip],
    )
  } else {
    // user_survey.id 是 varchar 主键且非自增，由服务端生成
    await pool.query(
      `INSERT INTO user_survey
      (id, ip, education, experience, skill_tags, city, current_salary, expect_salary, create_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), ip, ...values],
    )
  }

  res.json({
    code: 0,
    message: 'success',
  })
})
