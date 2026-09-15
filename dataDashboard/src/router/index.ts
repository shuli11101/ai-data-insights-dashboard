import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
