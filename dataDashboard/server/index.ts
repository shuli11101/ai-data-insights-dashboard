import { createApp } from './app'
import './config/env'

createApp().listen(Number(process.env.PORT), () => {
  console.log(`[server] http://127.0.0.1:${process.env.PORT ?? 3000}`)
})
