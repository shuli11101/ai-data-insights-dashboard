import { createApp } from './app'
import './config/env'

// CloudBase HTTP 云函数入口。
// 云函数是「常驻 Web 服务」模型，平台要求必须监听 0.0.0.0:9000，
// 由 cloudbase/scf_bootstrap 以 `node index.js` 启动（不要用 serverless-http）。
const PORT = 9000

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`[cloudbase] running at http://0.0.0.0:${PORT}`)
})
