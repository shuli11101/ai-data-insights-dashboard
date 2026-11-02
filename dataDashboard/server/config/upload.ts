import { mkdirSync } from 'node:fs'
import path from 'node:path'

/**
 * 头像上传目录：本地开发用，跟随启动目录（dataDashboard/uploads）。
 * 生产环境建议改成对象存储，云函数的本地磁盘不可持久化。
 */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

/** 允许的图片类型 → 落盘扩展名（不信任原始文件名，扩展名由 MIME 决定） */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

/** 单个头像大小上限：2MB */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024

/** 目录不存在时创建，服务启动和每次上传前都可安全调用 */
export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}
