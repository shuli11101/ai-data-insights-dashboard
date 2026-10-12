import { createApp } from './app'
import './config/env'

// 本地开发入口：常驻监听，供 vite 的 /api 代理转发（见 vite.config.ts）。
const PORT = Number(process.env.PORT ?? 3000)

createApp().listen(PORT, () => {
  console.log(`[server] running at http://127.0.0.1:${PORT}`)
})
