export const router = [
  {
    path: '/',
    redirect: '/questionnaires',
  },
  {
    component: () => import('@/layouts/questionnaires'),
    children: [
      { path: '/questionnaires', component: () => import('@/pages/Questionnaire') },
      { path: '/questionnaires/answer', component: () => import('@/pages/QuestionnaireAnswer') },
      { path: '/questionnaires/edit', component: () => import('@/pages/QuestionnaireEdit') },
      { path: '/404', component: () => import('@/pages/404') },
      { path: '$', redirect: '/404' },
    ],
  },
] satisfies RouteConfig[];
