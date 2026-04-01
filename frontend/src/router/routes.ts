import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'article/:title', component: () => import('pages/ArticlePage.vue') },
      { path: 'about', component: () => import('pages/AboutPage.vue') },
      { path: 'imprint', component: () => import('pages/ImprintPage.vue') },
      { path: 'privacy', component: () => import('pages/PrivacyPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
