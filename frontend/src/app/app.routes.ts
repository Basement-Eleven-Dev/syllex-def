import { Routes } from '@angular/router';
import { LoginPage } from '../pages/login-page/login-page';
import { ResetPasswordPage } from '../pages/reset-password-page/reset-password-page';
import { TeacherLayout } from '../pages/teacher-layout/teacher-layout';
import { Dashboard } from '../pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage,
  },
  {
    path: 'password-reset',
    component: ResetPasswordPage,
  },
  {
    path: 't',
    component: TeacherLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
    ],
  },
];
