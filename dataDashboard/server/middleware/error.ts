import type { NextFunction, Request, Response } from 'express'

// 404 接口判断中间件
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    code: 1,
    message: '接口不存在',
  })
}

// 统一错误出口
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void{
  console.log('[server]', error)
  const message = error instanceof Error ? error.message : '服务器内部错误'
  res.status(500).json({
    code: 500,
    message,
  })
}
