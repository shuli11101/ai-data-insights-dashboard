import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import pool from '../config/db'

export const homeRouter = Router()

// 获取岗位数据
homeRouter.get('/jobList', async (req, res) => {
  const toFilter = (value: any): string | null => {
    const text = Array.isArray(value) ? value[0] : value
    return typeof text === 'string' && text !== '' ? text : null
  }

  const city = toFilter(req.query.city)
  const experience = toFilter(req.query.experience)
  const keyword = toFilter(req.query.keyword)
  const salaryFilter = toFilter(req.query.salary)
  // 薪资形如 "10-15"，也可能是开区间 "0-5" / "40-"；
  // split 出来的空段必须归一到 null，否则 '' IS NULL 不成立，条件会退化成 salary_max <= ''
  const [salaryMinText, salaryMaxText] = salaryFilter?.split('-') ?? []
  const salary_min = salaryMinText || null
  const salary_max = salaryMaxText || null
  console.log(experience)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const size = Math.min(100, Math.max(1, Number(req.query.size) || 10))

  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM job_positions
    WHERE (? IS NULL OR experience LIKE CONCAT('%' , ? , '%'))
    AND (? IS NULL OR district = ?)
    AND (? IS NULL OR salary_min >= ?)
    AND (? IS NULL OR salary_max <= ?)
    AND (? IS NULL OR JSON_CONTAINS(skill_tags, JSON_QUOTE(?)))`,
      [experience, experience, city, city, salary_min, salary_min, salary_max, salary_max, keyword, keyword],
),
    pool.query<RowDataPacket[]>
    (`SELECT
      id,
      company,
      job_name,
      salary_min,
      salary_max,
      experience,
      skill_tags
  FROM job_positions
  WHERE (? IS NULL OR experience LIKE CONCAT('%' , ? , '%'))
    AND (? IS NULL OR district = ?)
    AND (? IS NULL OR salary_min >= ?)
    AND (? IS NULL OR salary_max <= ?)
    AND (? IS NULL OR JSON_CONTAINS(skill_tags, JSON_QUOTE(?)))
  ORDER BY id DESC limit ?, ?;`,
      [experience, experience, city, city, salary_min, salary_min, salary_max, salary_max, keyword, keyword, (page - 1) * size, size],
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

// 计算薪资范围
homeRouter.get('/salaryRange', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT r.salary_range, IFNULL(t.jobCount, 0) AS jobCount
    FROM (
      SELECT '0-10K'  AS salary_range, 1 AS sort_no
      UNION ALL SELECT '10-15K', 2
      UNION ALL SELECT '15-20K', 3
      UNION ALL SELECT '20-25K', 4
      UNION ALL SELECT '25-30K', 5
      UNION ALL SELECT '30-35K', 6
      UNION ALL SELECT '35-40K', 7
      UNION ALL SELECT '40K+',   8
    ) r
    LEFT JOIN (
      SELECT
        CASE
          WHEN (salary_min + salary_max) / 2 < 10 THEN '0-10K'
          WHEN (salary_min + salary_max) / 2 < 15 THEN '10-15K'
          WHEN (salary_min + salary_max) / 2 < 20 THEN '15-20K'
          WHEN (salary_min + salary_max) / 2 < 25 THEN '20-25K'
          WHEN (salary_min + salary_max) / 2 < 30 THEN '25-30K'
          WHEN (salary_min + salary_max) / 2 < 35 THEN '30-35K'
          WHEN (salary_min + salary_max) / 2 < 40 THEN '35-40K'
          ELSE '40K+'
        END AS salary_range,
        COUNT(*) AS jobCount
      FROM job_positions
      GROUP BY salary_range
    ) t ON t.salary_range = r.salary_range
    ORDER BY r.sort_no
  `)

  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 获取技术栈热度数据
homeRouter.get('/skillTags', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
      skill AS skill_tag,
      COUNT(*) AS hot_count
      FROM job_positions,
          JSON_TABLE(skill_tags, '$[*]' COLUMNS (skill VARCHAR(50) PATH '$')) AS skill_list
      GROUP BY skill_tag
      ORDER BY hot_count DESC
      LIMIT 10;`)

  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 各地方岗位数量
homeRouter.get('/district', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
    district AS area_name,
    COUNT(*) AS job_count
    FROM job_positions
    GROUP BY district
    ORDER BY job_count DESC;
    `)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 工作经验对应平均薪资
homeRouter.get('/experienceSalary', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
    experience,
    ROUND(AVG((salary_min + salary_max) / 2), 0) AS avg_salary
    FROM job_positions
    GROUP BY experience
    ORDER BY
    FIELD(experience, '应届','1-3年','3-5年','5-10年','10年+');
    `)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 获取城市数据
homeRouter.get('/city', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`select distinct district from job_positions;`)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 获取技术关键词
homeRouter.get('/keywords', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT DISTINCT s.skill
    FROM job_positions j,
     JSON_TABLE(
             j.skill_tags,
             '$[*]' COLUMNS (skill VARCHAR(50) PATH '$')
     ) AS s;`)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})
