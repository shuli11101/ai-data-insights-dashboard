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
      ],
    },
  ],
})

export default router
