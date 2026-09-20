import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import pool from '../config/db'

export const homeRouter = Router()

// 获取岗位数据
homeRouter.get('/jobList', async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1)
  const size = Math.min(100, Math.max(1, Number(req.query.size) || 10))

  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM job_positions'),
    pool.query<RowDataPacket[]>('SELECT id, company, job_name, salary_min, salary_max, experience, skill_tags FROM job_positions ORDER BY id DESC LIMIT ?, ?',
      [(page - 1) * size, size],
    ),
  ])

  res.json({
    code: 0,
    message: 'success',
    data: {
      list: rows,
      total: (countRows[0] as RowDataPacket & { total: number }).total,
    }
  })
})
