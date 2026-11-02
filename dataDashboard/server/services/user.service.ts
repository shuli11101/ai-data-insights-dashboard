import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/db'

/** 求职意向（前端表单字段名保持一致，便于直接回显） */
export interface UserPreference {
  city: string
  jobTitle: string
  experience: string
  education: string
  skills: string[]
  currentSalary?: number
  expectedSalary?: number
  jobStatus: string
}

export interface UserProfile {
  id: number
  phone: string
  nickname: string
  avatar: string
  currentJob: string
  location: string
  // 工作经验不重复存，直接取求职意向里的同一字段
  experience: string
  reportCount: number
  // 已保存报告的平均综合匹配分，0-100 整数；没有报告时为 0
  averageScore: number
  favoriteCount: number
}

/**
 * 读取账号信息，用户不存在返回 null。
 * 工作经验来自 user_preference（同一份数据只存一处），未填写偏好时为空串；
 * 分析报告数量与平均分按用户已保存的匹配报告（job_match_report）统计，
 * 收藏数量按 user_favorite 的记录数统计。
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.phone, u.nickname, u.avatar, u.current_job, u.location,
            p.experience,
            (SELECT COUNT(*) FROM job_match_report r
              WHERE r.user_id = u.id) AS report_count,
            (SELECT ROUND(AVG(r.score)) FROM job_match_report r
              WHERE r.user_id = u.id) AS average_score,
            (SELECT COUNT(*) FROM user_favorite f
              WHERE f.user_id = u.id) AS favorite_count
     FROM app_user u
     LEFT JOIN user_preference p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    id: Number(row.id),
    phone: row.phone as string,
    nickname: (row.nickname as string) ?? '',
    avatar: (row.avatar as string) ?? '',
    currentJob: (row.current_job as string) ?? '',
    location: (row.location as string) ?? '',
    experience: (row.experience as string) ?? '',
    reportCount: Number(row.report_count ?? 0),
    averageScore: Number(row.average_score ?? 0),
    favoriteCount: Number(row.favorite_count ?? 0),
  }
}

export interface UpdateProfileInput {
  nickname?: unknown
  avatar?: unknown
  currentJob?: unknown
  location?: unknown
}

export type UpdateProfileResult =
  | { ok: true; data: UserProfile }
  | { ok: false; status: number; message: string }

/**
 * 更新账号信息，只允许改昵称、头像、目前职业、所在地。
 * 手机号与密码不在这里改；只更新传了的字段，返回更新后的完整信息。
 */
export async function updateUserProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const sets: string[] = []
  const values: unknown[] = []

  if (input.nickname !== undefined) {
    const nickname = toText(input.nickname)
    if (!nickname) return { ok: false, status: 400, message: '昵称不能为空' }
    if (nickname.length > 20) return { ok: false, status: 400, message: '昵称最多 20 个字' }
    sets.push('nickname = ?')
    values.push(nickname)
  }

  if (input.avatar !== undefined) {
    const avatar = toText(input.avatar)
    if (avatar.length > 500) return { ok: false, status: 400, message: '头像地址过长' }
    sets.push('avatar = ?')
    values.push(avatar || null)
  }

  if (input.currentJob !== undefined) {
    const currentJob = toText(input.currentJob)
    if (currentJob.length > 64) return { ok: false, status: 400, message: '目前职业最多 64 个字' }
    sets.push('current_job = ?')
    values.push(currentJob || null)
  }

  if (input.location !== undefined) {
    const location = toText(input.location)
    if (location.length > 64) return { ok: false, status: 400, message: '所在地最多 64 个字' }
    sets.push('location = ?')
    values.push(location || null)
  }

  if (sets.length === 0) {
    return { ok: false, status: 400, message: '没有需要更新的字段' }
  }

  values.push(userId)
  await pool.query(`UPDATE app_user SET ${sets.join(', ')} WHERE id = ?`, values)

  const profile = await getUserProfile(userId)
  if (!profile) {
    return { ok: false, status: 404, message: '用户不存在' }
  }

  return { ok: true, data: profile }
}

/** 当前用户是否收藏了某个职位 */
export async function isFavorited(userId: number, jobId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM user_favorite WHERE user_id = ? AND job_id = ? LIMIT 1',
    [userId, jobId],
  )
  return rows.length > 0
}

/** 收藏列表项：岗位摘要 + 收藏时间 */
export interface FavoriteJob {
  id: number
  company: string
  jobName: string
  city: string
  district: string
  salaryMin: number
  salaryMax: number
  experience: string
  skillTags: string[]
  publishDate: Date | string | null
  favoriteTime: Date
}

/**
 * 当前用户的收藏列表，按收藏时间倒序，不分页。
 * 岗位被删除时 INNER JOIN 查不到，该条收藏自动不出现在列表里。
 */
export async function listFavorites(userId: number): Promise<FavoriteJob[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT j.id, j.company, j.job_name, j.city, j.district,
            j.salary_min, j.salary_max, j.experience, j.skill_tags, j.publish_date,
            f.create_time
     FROM user_favorite f
     INNER JOIN job_positions j ON j.id = f.job_id
     WHERE f.user_id = ?
     ORDER BY f.create_time DESC, f.id DESC`,
    [userId],
  )

  return rows.map((row) => ({
    id: Number(row.id),
    company: (row.company as string) ?? '',
    jobName: (row.job_name as string) ?? '',
    city: (row.city as string) ?? '',
    district: (row.district as string) ?? '',
    salaryMin: Number(row.salary_min ?? 0),
    salaryMax: Number(row.salary_max ?? 0),
    experience: (row.experience as string) ?? '',
    // skill_tags 是 JSON 列，mysql2 已解析成数组
    skillTags: (row.skill_tags as string[]) ?? [],
    publishDate: (row.publish_date as Date | string | null) ?? null,
    favoriteTime: row.create_time as Date,
  }))
}

/** 当前收藏数量 */
export async function countFavorites(userId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM user_favorite WHERE user_id = ?',
    [userId],
  )
  return Number(rows[0]?.total ?? 0)
}

/**
 * 收藏一个职位：唯一键 (user_id, job_id) 保证重复收藏不会重复计数，
 * 返回是否新增成功以及最新收藏数量。
 */
export async function addFavorite(userId: number, jobId: number): Promise<{ added: boolean; favoriteCount: number }> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT IGNORE INTO user_favorite (user_id, job_id) VALUES (?, ?)',
    [userId, jobId],
  )

  return {
    added: result.affectedRows > 0,
    favoriteCount: await countFavorites(userId),
  }
}

/** 取消收藏，返回是否真的删除了以及最新收藏数量 */
export async function removeFavorite(userId: number, jobId: number): Promise<{ removed: boolean; favoriteCount: number }> {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM user_favorite WHERE user_id = ? AND job_id = ?',
    [userId, jobId],
  )

  return {
    removed: result.affectedRows > 0,
    favoriteCount: await countFavorites(userId),
  }
}

/** 空值/非法值统一转 null，避免 INT 列报错 */
function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 是否已填写求职意向 */
export async function hasPreference(userId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM user_preference WHERE user_id = ? LIMIT 1',
    [userId],
  )
  return rows.length > 0
}

/** 读取求职意向，未填写返回 null */
export async function getPreference(userId: number): Promise<UserPreference | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT city, job_title, experience, education, skill_tags,
            current_salary, expect_salary, job_status
     FROM user_preference
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    city: row.city ?? '',
    jobTitle: row.job_title ?? '',
    experience: row.experience ?? '',
    education: row.education ?? '',
    // skill_tags 是 JSON 列，mysql2 已自动解析成数组
    skills: row.skill_tags ?? [],
    currentSalary: row.current_salary ?? undefined,
    expectedSalary: row.expect_salary ?? undefined,
    jobStatus: row.job_status ?? '',
  }
}

export type SavePreferenceResult =
  | { ok: true; data: UserPreference }
  | { ok: false; status: number; message: string }

/**
 * 保存求职意向：按 user_id 做 upsert，一个用户只有一条。
 * 与旧表单一致，工作经验、意向城市、技能为必填。
 */
export async function savePreference(userId: number, input: Record<string, unknown>): Promise<SavePreferenceResult> {
  const city = toText(input.city)
  const jobTitle = toText(input.jobTitle)
  const experience = toText(input.experience)
  const education = toText(input.education)
  const jobStatus = toText(input.jobStatus)
  const skills = Array.isArray(input.skills)
    ? [...new Set(input.skills.map((item) => toText(item)).filter(Boolean))]
    : []

  if (!experience || !city || skills.length === 0) {
    return { ok: false, status: 400, message: '工作经验、意向城市、拥有技术为必填项' }
  }
  if (city.length > 32 || experience.length > 32 || education.length > 32) {
    return { ok: false, status: 400, message: '城市、经验、学历长度不能超过 32 个字' }
  }
  if (jobTitle.length > 64) {
    return { ok: false, status: 400, message: '意向岗位最多 64 个字' }
  }
  if (jobStatus.length > 16) {
    return { ok: false, status: 400, message: '求职状态最多 16 个字' }
  }
  if (skills.length > 30 || skills.some((skill) => skill.length > 20)) {
    return { ok: false, status: 400, message: '技能最多 30 项，单项不超过 20 个字' }
  }

  const currentSalary = toNumberOrNull(input.currentSalary)
  const expectedSalary = toNumberOrNull(input.expectedSalary)
  if ((currentSalary !== null && currentSalary < 0) || (expectedSalary !== null && expectedSalary < 0)) {
    return { ok: false, status: 400, message: '薪资格式错误' }
  }

  await pool.query(
    `INSERT INTO user_preference
       (user_id, city, job_title, experience, education, skill_tags, current_salary, expect_salary, job_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       city = VALUES(city),
       job_title = VALUES(job_title),
       experience = VALUES(experience),
       education = VALUES(education),
       skill_tags = VALUES(skill_tags),
       current_salary = VALUES(current_salary),
       expect_salary = VALUES(expect_salary),
       job_status = VALUES(job_status)`,
    [
      userId,
      city,
      jobTitle || null,
      experience,
      education || null,
      JSON.stringify(skills),
      currentSalary,
      expectedSalary,
      jobStatus || null,
    ],
  )

  const saved = await getPreference(userId)
  return { ok: true, data: saved! }
}
