import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录 / 注册：独立全屏页面，不套用顶部导航布局
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/register/index.vue'),
    },
    {
      path: '/',
      name: 'index',
      component: () => import('@/components/layout.vue'),
      children: [
        {
          path: '/',
          name: 'home',
          component: () => import('@/views/home/index.vue'),
        },
        {
          path: '/ai-analyse',
          name: 'ai-analyse',
          component: () => import('@/views/aiAnalyse/index.vue'),
          // 沉浸模式：隐藏全局导航，鼠标移到页面顶部时再浮出
          meta: { immersive: true },
        },
        {
          path: '/personal-info',
          name: 'personal-info',
          component: () => import('@/views/personalInfo/index.vue'),
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/about/index.vue'),
        },
      ],
    },
  ],
})

export default router
