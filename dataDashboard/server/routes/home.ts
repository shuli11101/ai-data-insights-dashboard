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

  // 经验区间、薪资区间传的是数字的字符串形式，空值归一到 null
  const toNumber = (value: any): number | null => {
    const text = toFilter(value)
    if (text === null) return null
    const num = Number(text)
    return Number.isFinite(num) ? num : null
  }

  const city = toFilter(req.query.city)
  const experienceMin = toNumber(req.query.experienceMin)
  const experienceMax = toNumber(req.query.experienceMax)
  const salaryMin = toNumber(req.query.salaryMin)
  const salaryMax = toNumber(req.query.salaryMax)
  const keyword = toFilter(req.query.keyword)
  const jobName = toFilter(req.query.jobName)
  const page = Math.max(Number(req.query.page) || 1, 1)
  const size = Math.min(100, Math.max(1, Number(req.query.size) || 10))

  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM job_positions
    WHERE (? IS NULL OR job_name LIKE CONCAT('%' , ? , '%'))
    AND (
      -- 经验区间：两端都没填时放行
      (? IS NULL AND ? IS NULL)
      OR (
        -- 库里的经验是文本（"3-4年经验" / "10年以上经验"），先折算出年份区间再与所选区间求交集
        IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+') AS UNSIGNED), 0) <= IFNULL(?, 999)
        AND (CASE
              WHEN experience LIKE '%以上%' THEN 999
              ELSE IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+', 1, 2) AS UNSIGNED),
                          IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+') AS UNSIGNED), 0))
            END) >= IFNULL(?, 0)
      )
    )
    AND (? IS NULL OR city = ?)
    AND (
      -- 薪资区间：两端都没填时放行，否则与岗位薪资范围有交集即命中
      (? IS NULL AND ? IS NULL)
      OR (salary_min <= IFNULL(?, 9999) AND salary_max >= IFNULL(?, 0))
    )
    AND (? IS NULL OR JSON_CONTAINS(skill_tags, JSON_QUOTE(?)))`,
      [jobName, jobName, experienceMin, experienceMax, experienceMax, experienceMin,
        city, city, salaryMin, salaryMax, salaryMax, salaryMin, keyword, keyword],
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
  WHERE (? IS NULL OR job_name LIKE CONCAT('%' , ? , '%'))
    AND (
      -- 经验区间：两端都没填时放行
      (? IS NULL AND ? IS NULL)
      OR (
        -- 库里的经验是文本（"3-4年经验" / "10年以上经验"），先折算出年份区间再与所选区间求交集
        IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+') AS UNSIGNED), 0) <= IFNULL(?, 999)
        AND (CASE
              WHEN experience LIKE '%以上%' THEN 999
              ELSE IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+', 1, 2) AS UNSIGNED),
                          IFNULL(CAST(REGEXP_SUBSTR(experience, '[0-9]+') AS UNSIGNED), 0))
            END) >= IFNULL(?, 0)
      )
    )
    AND (? IS NULL OR city = ?)
    AND (
      -- 薪资区间：两端都没填时放行，否则与岗位薪资范围有交集即命中
      (? IS NULL AND ? IS NULL)
      OR (salary_min <= IFNULL(?, 9999) AND salary_max >= IFNULL(?, 0))
    )
    AND (? IS NULL OR JSON_CONTAINS(skill_tags, JSON_QUOTE(?)))
  ORDER BY id DESC limit ?, ?;`,
      [jobName, jobName, experienceMin, experienceMax, experienceMax, experienceMin,
        city, city, salaryMin, salaryMax, salaryMax, salaryMin, keyword, keyword, (page - 1) * size, size],
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
      WHERE skill IS NOT NULL AND skill <> ''
      GROUP BY skill_tag
      ORDER BY hot_count DESC
      LIMIT 10;`)

  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 各城市岗位数量：按 city 聚合，只保留岗位数前 8 的城市，其余合并为「其他」
// （原按 district 聚合，空值 6370 条、粒度过细，且全量下发会有几百个扇区）
// 「异地招聘」不是真实城市，直接从统计口径中剔除
homeRouter.get('/district', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
    t.area_name,
    -- SUM 返回 DECIMAL，会被 mysql2 序列化成字符串，这里转回数字
    CAST(SUM(t.job_count) AS UNSIGNED) AS job_count
    FROM (
      SELECT IF(r.rn <= 8, r.city, '其他') AS area_name, r.n AS job_count
      FROM (
        SELECT city, COUNT(*) AS n, ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rn
        FROM job_positions
        WHERE city IS NOT NULL AND city <> '' AND city <> '异地招聘'
        GROUP BY city
      ) r
    ) t
    GROUP BY t.area_name
    ORDER BY (t.area_name = '其他'), job_count DESC;
    `)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 工作经验对应平均薪资
// 库里的经验是细粒度值（1年经验 / 3-4年经验 …），先用 CASE 归并成 4 档，
// 再按档位排序（FIELD 必须与归并后的档位名完全一致，否则全部返回 0，x 轴顺序会乱）
homeRouter.get('/experienceSalary', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT
    t.exp_group AS experience,

    CAST(ROUND(AVG(t.mid_salary), 0) AS UNSIGNED) AS avg_salary
    FROM (
      SELECT
        CASE
          WHEN experience IN ('无需经验', '在校生/应届生') THEN '无需经验'
          WHEN experience IN ('1年经验', '2年经验') THEN '1-3年'
          WHEN experience = '3-4年经验' THEN '3-5年'
          ELSE '≥5年'
        END AS exp_group,
        (salary_min + salary_max) / 2 AS mid_salary
      FROM job_positions
      WHERE experience IS NOT NULL AND experience <> ''
    ) t
    GROUP BY t.exp_group
    ORDER BY FIELD(t.exp_group, '无需经验','1-3年','3-5年','≥5年');
    `)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 获取城市数据（下拉筛选项，与 jobList 的 city 条件同口径）
homeRouter.get('/city', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT city FROM job_positions WHERE city IS NOT NULL AND city <> '' ORDER BY city;`,
  )
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})

// 获取技术关键词：只取出现频次最高的前 N 个
// 全量下发过 12 万条，前端会把它们全渲染成下拉项，直接卡死页面
homeRouter.get('/keywords', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT s.skill
    FROM job_positions j,
     JSON_TABLE(
             j.skill_tags,
             '$[*]' COLUMNS (skill VARCHAR(50) PATH '$')
     ) AS s
    WHERE s.skill IS NOT NULL AND s.skill <> ''
    GROUP BY s.skill
    ORDER BY COUNT(*) DESC
    LIMIT 100;`)
  res.json({
    code: 0,
    message: 'success',
    data: rows,
  })
})
