export const router = [
  {
    path: '/',
    redirect: { to: '/questionnaires' },
  },
  {
    component: () => import('@/layouts/questionnaires'),
    children: [
      { path: '/questionnaires', component: () => import('@/pages/Questionnaire') },
      { path: '/questionnaires/answer', component: () => import('@/pages/QuestionnaireAnswer') },
      {
        path: '/questionnaires/questions',
        component: () => import('@/pages/QuestionnaireQuestions'),
      },
      {
        path: '/questionnaires/edit',
        redirect: { to: '/questionnaires/questions', search: true, hash: true },
      },
      { path: '/404', component: () => import('@/pages/404') },
      { path: '$', redirect: { to: '/404' } },
    ],
  },
] satisfies RouteConfig[];
