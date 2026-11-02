import { createApp } from './app'
import './config/env'
import { ensureConversationTables } from './services/conversation.service'
import { ensureUserSchema } from './services/auth.service'
import { ensureMatchTable } from './services/match.service'

// CloudBase HTTP 云函数入口。
// 云函数是「常驻 Web 服务」模型，平台要求必须监听 0.0.0.0:9000，
// 由 cloudbase/scf_bootstrap 以 `node index.js` 启动（不要用 serverless-http）。
const PORT = 9000

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

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`[cloudbase] running at http://0.0.0.0:${PORT}`)
})
