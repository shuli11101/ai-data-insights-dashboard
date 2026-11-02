import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import '../config/env'
import pool from '../config/db'

/** 短信服务接入前，所有手机号共用这个固定验证码 */
const FIXED_VERIFY_CODE = '123456'

/** 中国大陆手机号：1 开头，第二位 3-9，共 11 位 */
const PHONE_PATTERN = /^1[3-9]\d{9}$/

/** 8-32 位，不能有空格，且必须同时包含字母和数字 */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)\S{8,32}$/

/** token 有效期 7 天 */
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

/** 密钥在签发时读取，避免模块加载顺序早于 dotenv 导致读到空值 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('缺少 JWT_SECRET，请在 .env 中配置')
  }
  return secret
}

const CREATE_USER_TABLE = `CREATE TABLE IF NOT EXISTS app_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(32) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  current_job VARCHAR(64) DEFAULT NULL,
  location VARCHAR(64) DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

const CREATE_PREFERENCE_TABLE = `CREATE TABLE IF NOT EXISTS user_preference (
  user_id BIGINT UNSIGNED NOT NULL,
  city VARCHAR(32) DEFAULT NULL,
  job_title VARCHAR(64) DEFAULT NULL,
  experience VARCHAR(32) DEFAULT NULL,
  education VARCHAR(32) DEFAULT NULL,
  skill_tags JSON DEFAULT NULL,
  current_salary INT DEFAULT NULL,
  expect_salary INT DEFAULT NULL,
  job_status VARCHAR(16) DEFAULT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

const CREATE_FAVORITE_TABLE = `CREATE TABLE IF NOT EXISTS user_favorite (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  job_id BIGINT UNSIGNED NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_job (user_id, job_id),
  KEY idx_user_time (user_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`

/** 老库升级用：列不存在时才 ALTER，避免每次启动报重复列错误 */
async function addColumnIfMissing(column: string, definition: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'app_user' AND column_name = ?`,
    [column],
  )
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE app_user ADD COLUMN ${column} ${definition}`)
  }
}

/** 列存在时才删，用于清理已废弃的字段 */
async function dropColumnIfExists(column: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'app_user' AND column_name = ?`,
    [column],
  )
  if (rows.length > 0) {
    await pool.query(`ALTER TABLE app_user DROP COLUMN ${column}`)
  }
}

/**
 * 账号与偏好相关表初始化（幂等），服务启动时调用一次。
 * user_survey 是早期按 IP 存的问卷表，改成登录后填写求职意向后已废弃，这里直接清掉。
 */
export async function ensureUserSchema(): Promise<void> {
  await pool.query(CREATE_USER_TABLE)
  await addColumnIfMissing('nickname', 'VARCHAR(32) DEFAULT NULL')
  await addColumnIfMissing('avatar', 'VARCHAR(500) DEFAULT NULL')
  // 现状信息：目前职业、所在地
  await addColumnIfMissing('current_job', 'VARCHAR(64) DEFAULT NULL')
  await addColumnIfMissing('location', 'VARCHAR(64) DEFAULT NULL')
  await pool.query(CREATE_PREFERENCE_TABLE)
  // 收藏改为 user_favorite 关联表 + 实时统计，旧的计数列不再需要
  await pool.query(CREATE_FAVORITE_TABLE)
  await dropColumnIfExists('favorite_count')
  await pool.query('DROP TABLE IF EXISTS user_survey')
}

/** 密码加盐哈希：scrypt$盐$哈希，盐随密码一起存，便于后续校验 */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

/** 默认昵称：job_ + 6 位小写字母或数字 */
const NICKNAME_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function createDefaultNickname(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += NICKNAME_CHARS[randomInt(NICKNAME_CHARS.length)]
  }
  return `job_${suffix}`
}

/** 校验密码：取出盐重新计算，再与库里的哈希做定长比较 */
function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false

  const actual = Buffer.from(scryptSync(password, salt, 64).toString('hex'))
  const expected = Buffer.from(hash)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

interface JwtPayload {
  sub: number
  phone: string
}

/** 按 JWT 标准（HS256）签名，不依赖第三方库 */
export function signToken(payload: JwtPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS }
  const encoded = `${toBase64Url(header)}.${toBase64Url(body)}`
  const signature = createHmac('sha256', getJwtSecret()).update(encoded).digest('base64url')

  return `${encoded}.${signature}`
}

function toBase64Url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * 校验 token 并取出 payload：签名不一致、格式错误、已过期都返回 null。
 * 签名比较用 timingSafeEqual，避免按字节逐位比较带来的时序泄漏。
 */
export function verifyToken(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, body, signature] = parts as [string, string, string]
  const expected = createHmac('sha256', getJwtSecret())
    .update(`${header}.${body}`)
    .digest('base64url')

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null

  let payload: { sub?: unknown; phone?: unknown; exp?: unknown }
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload.sub !== 'number' || typeof payload.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null

  return {
    sub: payload.sub,
    phone: typeof payload.phone === 'string' ? payload.phone : '',
  }
}

function isDuplicateEntry(error: unknown): boolean {
  return (error as { code?: string })?.code === 'ER_DUP_ENTRY'
}

export interface RegisterInput {
  phone?: unknown
  code?: unknown
  password?: unknown
  nickname?: unknown
  avatar?: unknown
}

export type RegisterResult =
  | { ok: true; data: { token: string } }
  | { ok: false; status: number; message: string }

/**
 * 注册：校验手机号、验证码、密码格式，写入用户后签发 token。
 * nickname / avatar 可选，昵称不填时默认「job_ + 6 位随机字母数字」。
 * 校验失败返回可直接回给前端的状态码与提示，数据库异常继续向上抛。
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  const code = typeof input.code === 'string' ? input.code.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const nickname = typeof input.nickname === 'string' ? input.nickname.trim() : ''
  const avatar = typeof input.avatar === 'string' ? input.avatar.trim() : ''

  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, status: 400, message: '手机号格式错误' }
  }
  if (code !== FIXED_VERIFY_CODE) {
    return { ok: false, status: 400, message: '验证码错误' }
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return { ok: false, status: 400, message: '密码需为 8-32 位，且同时包含字母和数字' }
  }
  if (nickname.length > 20) {
    return { ok: false, status: 400, message: '昵称最多 20 个字' }
  }
  if (avatar.length > 500) {
    return { ok: false, status: 400, message: '头像地址过长' }
  }

  const [existed] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM app_user WHERE phone = ? LIMIT 1',
    [phone],
  )
  if (existed.length > 0) {
    return { ok: false, status: 409, message: '该手机号已注册' }
  }

  const finalNickname = nickname || createDefaultNickname()

  let insertId: number
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO app_user (phone, password_hash, nickname, avatar) VALUES (?, ?, ?, ?)',
      [phone, hashPassword(password), finalNickname, avatar || null],
    )
    insertId = Number(result.insertId)
  } catch (error) {
    // 并发注册时唯一索引会兜底，这里转成同样的业务提示
    if (isDuplicateEntry(error)) {
      return { ok: false, status: 409, message: '该手机号已注册' }
    }
    throw error
  }

  return {
    ok: true,
    data: {
      token: signToken({ sub: insertId, phone }),
    },
  }
}

export interface LoginInput {
  phone?: unknown
  password?: unknown
}

export type LoginResult =
  | { ok: true; data: { token: string } }
  | { ok: false; status: number; message: string }

/**
 * 登录：手机号 + 密码，成功后签发新 token。
 * 手机号不存在与密码错误返回同一句提示，避免暴露哪些号码已注册。
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''

  if (!PHONE_PATTERN.test(phone) || !password) {
    return { ok: false, status: 400, message: '请输入正确的手机号和密码' }
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, password_hash FROM app_user WHERE phone = ? LIMIT 1',
    [phone],
  )

  const user = rows[0]
  if (!user || !verifyPassword(password, user.password_hash as string)) {
    return { ok: false, status: 401, message: '手机号或密码错误' }
  }

  return {
    ok: true,
    data: {
      token: signToken({ sub: Number(user.id), phone }),
    },
  }
}
