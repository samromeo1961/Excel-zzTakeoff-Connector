import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/zztakeoff-web'
    },
    {
      path: '/excel',
      name: 'Excel',
      component: () => import('../components/Excel/ExcelGridTab.vue')
    },
    {
      path: '/recents',
      name: 'Recents',
      component: () => import('../components/Recents/RecentsTab.vue')
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('../components/History/HistoryTab.vue')
    },
    {
      path: '/zztakeoff-web',
      name: 'ZzTakeoffWeb',
      component: () => import('../components/ZzTakeoff/ZzTakeoffWebTab.vue')
    },
    {
      path: '/preferences',
      name: 'Preferences',
      component: () => import('../components/Preferences/PreferencesTab.vue')
    },
    {
      path: '/templates',
      name: 'Templates',
      component: () => import('../components/Templates/TemplatesTab.vue')
    }
  ]
});

export default router;
