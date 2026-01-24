import { Routes } from '@angular/router';
import { LoginPage } from '../pages/login-page/login-page';
import { ResetPasswordPage } from '../pages/reset-password-page/reset-password-page';
import { TeacherLayout } from '../pages/teacher-layout/teacher-layout';
import { Dashboard } from '../pages/dashboard/dashboard';
import { Test } from '../pages/test/test';
import { authGuard, guestGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage,
    canActivate: [guestGuard],
  },
  {
    path: 'password-reset',
    component: ResetPasswordPage,
    canActivate: [],
  },
  {
    path: 't',
    component: TeacherLayout,
    canActivate: [],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'test',
        component: Test,
      },
      {
        path: 'comunicazioni',
        component: Test,
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
