import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 前端开发服务器端口。Spring Boot 占用 8081，这里固定用 8082，
    // strictPort 保证端口被占用时直接报错，而不是悄悄顺延到 8083 造成地址漂移。
    port: 8082,
    strictPort: true,
    proxy: {
      //  node 配置
      // '/api': 'http://127.0.0.1:3000'

      // spring boot 配置
      '/api': {
        target: 'http://127.0.0.1:8081',
        // 把 Host 头改成后端地址，避免 Spring Boot 按来源 Host 做校验时出现 401 / 重定向异常
        changeOrigin: true,
        // 浏览器 POST 会带 Origin: http://localhost:8082，Spring Boot 的 CORS 只信任 8081，
        // 这里改写成后端自身来源，绕开 "Invalid CORS request" 403
        headers: {
          origin: 'http://127.0.0.1:8081',
        },
      }
    }
  }
})
