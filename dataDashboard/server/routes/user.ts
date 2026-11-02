import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { requireAuth } from '../middleware/auth'
import { IMAGE_EXTENSIONS, MAX_AVATAR_SIZE, UPLOAD_DIR, ensureUploadDir } from '../config/upload'
import {
  addFavorite,
  getUserProfile,
  listFavorites,
  removeFavorite,
  updateUserProfile,
} from '../services/user.service'
import {
  deleteMatchReports,
  getMatchReport,
  getMatchReportDetail,
  listMatchReports,
  parseMatchScore,
  saveMatchReport,
} from '../services/match.service'

export const userRouter = Router()

ensureUploadDir()

// 头像上传：只收图片，文件名用随机 UUID，扩展名按 MIME 决定
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${IMAGE_EXTENSIONS[file.mimetype] ?? ''}`),
  }),
  limits: { fileSize: MAX_AVATAR_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    // 类型不支持时直接丢弃，由后续判断返回提示
    cb(null, Boolean(IMAGE_EXTENSIONS[file.mimetype]))
  },
})

/** jobId 必须是正整数，避免脏数据入库 */
function parseJobId(value: unknown): number | null {
  const num = Number(value)
  return Number.isInteger(num) && num > 0 ? num : null
}

// 一次批量删除最多 50 个，避免超长 SQL
const MAX_BATCH_DELETE = 50

/**
 * 把数组 / 逗号分隔字符串 / 重复 query 参数归一成去重后的 jobId 列表。
 * 只要有一个不合法就整体返回 null，避免带脏数据进 SQL。
 */
function collectJobIds(value: unknown): number[] | null {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : null
  if (!list) return null

  const ids = new Set<number>()
  for (const item of list) {
    const jobId = parseJobId(item)
    if (jobId === null) return null
    ids.add(jobId)
  }

  if (ids.size === 0 || ids.size > MAX_BATCH_DELETE) return null
  return [...ids]
}

/**
 * 获取当前登录用户的账号信息
 * GET /api/user/profile
 * 需要 Authorization: Bearer <token>
 * 返回 { code, message, data: { id, phone, nickname, avatar } }
 */
userRouter.get('/profile', requireAuth, async (req, res) => {
  const profile = await getUserProfile(req.userId!)

  if (!profile) {
    return res.status(404).json({
      code: 1,
      message: '用户不存在',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: profile,
  })
})

/**
 * 上传头像
 * POST /api/user/avatar
 * multipart/form-data，字段名 file，支持 png / jpg / webp / gif，单张不超过 2MB
 * 返回 { url }；前端拿到 URL 后再调 PUT /api/user/profile 保存到 avatar
 */
userRouter.post('/avatar', requireAuth, (req, res) => {
  avatarUpload.single('file')(req, res, (error: unknown) => {
    if (error) {
      const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
        ? '图片不能超过 2MB'
        : '图片上传失败'
      res.status(400).json({ code: 1, message })
      return
    }

    if (!req.file) {
      res.status(400).json({
        code: 1,
        message: '请上传 png / jpg / webp / gif 图片',
      })
      return
    }

    res.json({
      code: 0,
      message: 'success',
      data: { url: `/api/uploads/${req.file.filename}` },
    })
  })
})

/**
 * 更新当前用户的账号信息
 * PUT /api/user/profile
 * 可选字段：nickname / avatar / currentJob / location，只更新传了的
 * 返回更新后的完整账号信息
 */
userRouter.put('/profile', requireAuth, async (req, res) => {
  const result = await updateUserProfile(req.userId!, req.body ?? {})

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
 * 保存匹配度报告（用户点击「保存报告」时调用）
 * POST /api/user/match-report
 * { "jobId": 123, "content": "## 综合匹配分\n72\n..." }
 * 分数由服务端从正文里解析，重复保存会覆盖旧报告。
 * 返回 { score }
 */
userRouter.post('/match-report', requireAuth, async (req, res) => {
  const jobId = parseJobId(req.body?.jobId)

  if (jobId === null) {
    return res.status(400).json({
      code: 1,
      message: 'jobId 参数错误',
    })
  }

  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!content) {
    return res.status(400).json({
      code: 1,
      message: 'content 不能为空',
    })
  }
  if (content.length > 20000) {
    return res.status(400).json({
      code: 1,
      message: 'content 过长',
    })
  }

  const score = parseMatchScore(content)
  await saveMatchReport(req.userId!, jobId, score, content)

  res.json({
    code: 0,
    message: 'success',
    data: { score },
  })
})

/**
 * 获取当前用户对某个岗位的匹配度报告（已生成过才返回）
 * GET /api/user/match-report?jobId=123
 * 返回 { score, content, updateTime }
 */
userRouter.get('/match-report', requireAuth, async (req, res) => {
  const jobId = parseJobId(req.query.jobId)

  if (jobId === null) {
    return res.status(400).json({
      code: 1,
      message: 'jobId 参数错误',
    })
  }

  const report = await getMatchReport(req.userId!, jobId)
  if (!report) {
    return res.status(404).json({
      code: 1,
      message: '暂无匹配报告',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: report,
  })
})

/**
 * 分析报告列表：当前用户已保存的全部报告，按最后更新时间倒序
 * GET /api/user/match-report/list
 * 返回 { list: [{ reportId, jobId, jobName, company, location, experience,
 *               skillCoverage, salaryDeviation, score, saveTime }], total }
 * 技能覆盖率 / 薪资偏差由服务端从报告正文解析，正文本身不下发；
 * 点击某项后按 jobId 再调 /match-report/detail 取完整报告
 */
userRouter.get('/match-report/list', requireAuth, async (req, res) => {
  const result = await listMatchReports(req.userId!)

  res.json({
    code: 0,
    message: 'success',
    data: result,
  })
})

/**
 * 分析报告详细数据：报告正文 + 对应岗位信息，供报告详情页一次性展示
 * GET /api/user/match-report/detail?jobId=123
 * 返回 { report: { id, score, content, createTime, updateTime }, job: {...} }
 */
userRouter.get('/match-report/detail', requireAuth, async (req, res) => {
  const jobId = parseJobId(req.query.jobId)

  if (jobId === null) {
    return res.status(400).json({
      code: 1,
      message: 'jobId 参数错误',
    })
  }

  const detail = await getMatchReportDetail(req.userId!, jobId)
  if (!detail) {
    return res.status(404).json({
      code: 1,
      message: '暂无匹配报告',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: detail,
  })
})

/**
 * 批量删除分析报告：单个删除也走这个接口，只能删当前用户自己的报告
 * DELETE /api/user/match-report
 *   { "jobIds": [123, 456] }
 * 也可用 query 传：?jobIds=123,456 或 ?jobId=123
 * 返回 { deleted, missing }；不属于自己的 ID 计入 missing，一条都没删到返回 404
 */
userRouter.delete('/match-report', requireAuth, async (req, res) => {
  const jobIds = collectJobIds(req.body?.jobIds)
    ?? collectJobIds(req.query.jobIds)
    ?? collectJobIds(req.query.jobId)

  if (!jobIds) {
    return res.status(400).json({
      code: 1,
      message: `jobIds 参数错误（1-${MAX_BATCH_DELETE} 个合法 ID）`,
    })
  }

  const result = await deleteMatchReports(req.userId!, jobIds)
  if (result.deleted === 0) {
    return res.status(404).json({
      code: 1,
      message: '报告不存在',
    })
  }

  res.json({
    code: 0,
    message: 'success',
    data: result,
  })
})

/**
 * 收藏职位：按 (user_id, job_id) 去重，重复收藏不会重复计数
 * POST /api/user/favorite
 * { "jobId": 123 }
 * 返回 { added, favoriteCount }
 */
userRouter.post('/favorite', requireAuth, async (req, res) => {
  const jobId = parseJobId(req.body?.jobId)

  if (jobId === null) {
    return res.status(400).json({
      code: 1,
      message: 'jobId 参数错误',
    })
  }

  const result = await addFavorite(req.userId!, jobId)

  res.json({
    code: 0,
    message: 'success',
    data: result,
  })
})

/**
 * 收藏列表：当前用户收藏的岗位，按收藏时间倒序，不分页
 * GET /api/user/favorite/list
 * 返回 { list: [{ id, company, jobName, city, district, salaryMin, salaryMax,
 *               experience, skillTags, publishDate, favoriteTime }], total }
 * 点击某个岗位后调 GET /api/home/jobDetail?id=xxx 取完整详情
 */
userRouter.get('/favorite/list', requireAuth, async (req, res) => {
  const list = await listFavorites(req.userId!)

  res.json({
    code: 0,
    message: 'success',
    data: { list, total: list.length },
  })
})

/**
 * 取消收藏
 * DELETE /api/user/favorite?jobId=123
 * 返回 { removed, favoriteCount }
 */
userRouter.delete('/favorite', requireAuth, async (req, res) => {
  const jobId = parseJobId(req.query.jobId)

  if (jobId === null) {
    return res.status(400).json({
      code: 1,
      message: 'jobId 参数错误',
    })
  }

  const result = await removeFavorite(req.userId!, jobId)

  res.json({
    code: 0,
    message: 'success',
    data: result,
  })
})
