import { createApp } from './app'
import './config/env'
import { ensureConversationTables } from './services/conversation.service'
import { ensureUserSchema } from './services/auth.service'
import { ensureMatchTable } from './services/match.service'

// 本地开发入口：常驻监听，供 vite 的 /api 代理转发（见 vite.config.ts）。
const PORT = Number(process.env.PORT ?? 3000)

// 建表是幂等的；失败只记录日志，不阻塞服务启动（AI 仍可用，只是不落库）
ensureConversationTables().catch((error) => {
  console.error('[db] AI 会话表初始化失败:', error)
})

ensureUserSchema().catch((error) => {
  console.error('[db] 账号与偏好表初始化失败:', error)
})

ensureMatchTable().catch((error) => {
  console.error('[db] 匹配报告表初始化失败:', error)
})

createApp().listen(PORT, () => {
  console.log(`[server] running at http://127.0.0.1:${PORT}`)
})
