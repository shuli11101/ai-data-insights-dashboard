import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/db'
import type { UserPreference } from './user.service'

/**
 * 岗位匹配度报告：
 * 一个用户对同一个岗位只保留最新一份，唯一键 (user_id, job_id)，
 * 再次分析时覆盖内容与分数。
 */
const CREATE_MATCH_TABLE = `CREATE TABLE IF NOT EXISTS job_match_report (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  score INT NOT NULL DEFAULT 0,
  content MEDIUMTEXT NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_job (user_id, job_id),
  KEY idx_user_time (user_id, update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

export interface MatchReport {
  score: number
  content: string
  updateTime: Date
}

/** 岗位信息里参与匹配的字段 */
export interface MatchJob {
  id: number
  jobName: string
  company: string
  city: string
  district: string
  salaryMin: number
  salaryMax: number
  experience: string
  skillTags: string[]
}

/** 建表（幂等），服务启动时调用一次 */
export async function ensureMatchTable(): Promise<void> {
  await pool.query(CREATE_MATCH_TABLE)
}

/** 读取该用户对该岗位的最近一次报告 */
export async function getMatchReport(userId: number, jobId: number): Promise<MatchReport | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT score, content, update_time
     FROM job_match_report
     WHERE user_id = ? AND job_id = ?
     LIMIT 1`,
    [userId, jobId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    score: Number(row.score ?? 0),
    content: row.content as string,
    updateTime: row.update_time as Date,
  }
}

/** 保存/覆盖报告 */
export async function saveMatchReport(
  userId: number,
  jobId: number,
  score: number,
  content: string,
): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO job_match_report (user_id, job_id, score, content)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE score = VALUES(score), content = VALUES(content)`,
    [userId, jobId, score, content],
  )
}

/** 把查询行里的岗位字段归一成 MatchJob，供匹配与报告详情共用 */
function mapMatchJob(row: RowDataPacket): MatchJob {
  return {
    id: Number(row.id),
    jobName: row.job_name as string,
    company: row.company as string,
    city: (row.city as string) ?? '',
    district: (row.district as string) ?? '',
    salaryMin: Number(row.salary_min ?? 0),
    salaryMax: Number(row.salary_max ?? 0),
    experience: (row.experience as string) ?? '',
    // skill_tags 是 JSON 列，mysql2 已解析成数组
    skillTags: (row.skill_tags as string[]) ?? [],
  }
}

/**
 * 批量删除该用户的报告：只删属于该用户的记录，不属于自己的计入 missing。
 * 先查一次已存在的 job_id，便于准确返回哪些没删到。
 */
export async function deleteMatchReports(
  userId: number,
  jobIds: number[],
): Promise<{ deleted: number; missing: number[] }> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT job_id FROM job_match_report WHERE user_id = ? AND job_id IN (?)',
    [userId, jobIds],
  )

  const found = rows.map((row) => Number(row.job_id))
  if (found.length === 0) {
    return { deleted: 0, missing: jobIds }
  }

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM job_match_report WHERE user_id = ? AND job_id IN (?)',
    [userId, found],
  )

  return {
    deleted: result.affectedRows,
    missing: jobIds.filter((jobId) => !found.includes(jobId)),
  }
}

/** 按岗位 id 取匹配需要的岗位信息，不存在返回 null */
export async function getMatchJob(jobId: number): Promise<MatchJob | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, job_name, company, city, district, salary_min, salary_max, experience, skill_tags
     FROM job_positions
     WHERE id = ?`,
    [jobId],
  )

  const row = rows[0]
  return row ? mapMatchJob(row) : null
}

/** 报告详情：报告本身 + 对应岗位信息，供详情页一次性展示 */
export interface MatchReportDetail {
  report: {
    id: number
    score: number
    content: string
    createTime: Date
    updateTime: Date
  }
  job: MatchJob
}

/**
 * 读取当前用户对某个岗位的已保存报告及岗位信息。
 * 岗位被删除时 INNER JOIN 查不到，同样按「暂无报告」返回 null。
 */
export async function getMatchReportDetail(
  userId: number,
  jobId: number,
): Promise<MatchReportDetail | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id AS report_id, r.score, r.content, r.create_time, r.update_time,
            j.id, j.job_name, j.company, j.city, j.district,
            j.salary_min, j.salary_max, j.experience, j.skill_tags
     FROM job_match_report r
     INNER JOIN job_positions j ON j.id = r.job_id
     WHERE r.user_id = ? AND r.job_id = ?
     LIMIT 1`,
    [userId, jobId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    report: {
      id: Number(row.report_id),
      score: Number(row.score ?? 0),
      content: row.content as string,
      createTime: row.create_time as Date,
      updateTime: row.update_time as Date,
    },
    job: mapMatchJob(row),
  }
}

/** 报告列表项：正文只用于解析技能覆盖率 / 薪资偏差，不直接下发给前端 */
export interface MatchReportListItem {
  reportId: number
  jobId: number
  jobName: string
  company: string
  // 城市 + 区域，如「深圳·南山区」；区域为空时只返回城市
  location: string
  experience: string
  // 技能覆盖率 0-100，报告里没有这一项时为 null
  skillCoverage: number | null
  // 薪资偏差 -100~100，负数表示期望薪资高于岗位上限；没有期望薪资时为 null
  salaryDeviation: number | null
  score: number
  saveTime: Date
}

export interface MatchReportListResult {
  list: MatchReportListItem[]
  total: number
}

/**
 * 当前用户的全部已保存报告，按最后更新时间倒序。
 * 岗位被删除时 INNER JOIN 查不到，该条报告自动不出现在列表里。
 */
export async function listMatchReports(userId: number): Promise<MatchReportListResult> {
  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM job_match_report WHERE user_id = ?',
      [userId],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT r.id AS report_id, r.job_id, r.score, r.content, r.update_time,
              j.job_name, j.company, j.city, j.district, j.experience
       FROM job_match_report r
       INNER JOIN job_positions j ON j.id = r.job_id
       WHERE r.user_id = ?
       ORDER BY r.update_time DESC, r.id DESC`,
      [userId],
    ),
  ])

  return {
    list: rows.map((row) => {
      const content = (row.content as string) ?? ''
      const city = (row.city as string) ?? ''
      const district = (row.district as string) ?? ''

      return {
        reportId: Number(row.report_id),
        jobId: Number(row.job_id),
        jobName: row.job_name as string,
        company: row.company as string,
        location: city && district ? `${city}·${district}` : city || district,
        experience: (row.experience as string) ?? '',
        skillCoverage: parseSkillCoverage(content),
        salaryDeviation: parseSalaryDeviation(content),
        score: Number(row.score ?? 0),
        saveTime: row.update_time as Date,
        // 列表已查出正文，一并返回，前端点击即可直接展示，无需二次请求
        content,
      }
    }),
    total: Number(countRows[0]?.total ?? 0),
  }
}

/** 解析报告「技术栈」小节里的技能覆盖率，没有该项返回 null */
export function parseSkillCoverage(content: string): number | null {
  const matched = /技能覆盖率[：:]\s*(\d{1,3})/.exec(content)
  if (!matched) return null

  return Math.min(100, Math.max(0, Number(matched[1])))
}

/** 解析报告「薪资」小节里的偏差百分比，负数表示期望高于岗位上限；没有该项返回 null */
export function parseSalaryDeviation(content: string): number | null {
  const matched = /偏差百分比[：:]\s*(-?\d{1,3})/.exec(content)
  if (!matched) return null

  return Math.min(100, Math.max(-100, Number(matched[1])))
}

/** 从模型输出里解析「综合匹配分」，解析不到按 0 处理 */
export function parseMatchScore(content: string): number {
  const matched = /##\s*综合匹配分\s*\n+\s*(\d{1,3})/.exec(content)
  if (!matched) return 0

  const score = Number(matched[1])
  return Math.min(100, Math.max(0, score))
}

/** 岗位信息转成提示词里的正文 */
export function formatJobPrompt(job: MatchJob): string {
  const skills = job.skillTags.filter(Boolean)

  return [
    '岗位信息：',
    `- 职位名称：${job.jobName}`,
    `- 公司：${job.company}`,
    `- 城市：${job.city}${job.district ? `（${job.district}）` : ''}`,
    `- 薪资：${job.salaryMin}k-${job.salaryMax}k`,
    `- 经验要求：${job.experience || '未提及'}`,
    `- 技能标签：${skills.length ? skills.join('、') : '未提及'}`,
  ].join('\n')
}

/** 求职者信息转成提示词里的补充信息 */
export function formatPreferencePrompt(preference: UserPreference): string {
  return [
    '求职者信息：',
    `- 意向城市：${preference.city || '未填写'}`,
    `- 意向岗位：${preference.jobTitle || '未填写'}`,
    `- 工作经验：${preference.experience || '未填写'}`,
    `- 学历：${preference.education || '未填写'}`,
    `- 掌握技能：${preference.skills.length ? preference.skills.join('、') : '未填写'}`,
    `- 当前月薪：${preference.currentSalary != null ? `${preference.currentSalary} 元` : '未填写'}`,
    `- 期望月薪：${preference.expectedSalary != null ? `${preference.expectedSalary} 元` : '未填写'}`,
    `- 求职状态：${preference.jobStatus || '未填写'}`,
  ].join('\n')
}
