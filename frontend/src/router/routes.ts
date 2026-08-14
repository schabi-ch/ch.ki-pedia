import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'article/:lang/:title', component: () => import('pages/ArticlePage.vue') },
      // Legacy links shared before language became part of the URL; falls
      // back to the viewer's own UI language, same as before this existed.
      { path: 'article/:title', component: () => import('pages/ArticlePage.vue') },
      { path: 'about', component: () => import('pages/AboutPage.vue') },
      { path: 'education', component: () => import('pages/EducationPage.vue') },
      { path: 'imprint', component: () => import('pages/ImprintPage.vue') },
      { path: 'privacy', component: () => import('pages/PrivacyPage.vue') },
      { path: 'statistics', component: () => import('pages/StatsPage.vue') },
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
