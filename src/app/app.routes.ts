import { Routes } from '@angular/router';
import { LoginPage } from '../pages/login-page/login-page';
import { ResetPasswordPage } from '../pages/reset-password-page/reset-password-page';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage,
  },
  {
    path: 'password-reset',
    component: ResetPasswordPage,
  },
];
