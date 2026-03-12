import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../guards/auth.guard';
import { teacherGuard } from '../guards/teacher.guard';
import { studentGuard } from '../guards/student.guard';
import { adminGuard } from '../guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../teacher/pages/login-page/login-page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'password-reset',
    loadComponent: () =>
      import('../teacher/pages/reset-password-page/reset-password-page').then(
        (m) => m.ResetPasswordPage,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 't',
    loadComponent: () =>
      import('../teacher/pages/teacher-layout/teacher-layout').then(
        (m) => m.TeacherLayout,
      ),
    loadChildren: () =>
      import('../teacher/teacher.routes').then((m) => m.teacherRoutes),
    canActivate: [authGuard, teacherGuard],
  },
  {
    path: 's',
    loadComponent: () =>
      import('../student/pages/student-layout/student-layout').then(
        (m) => m.StudentLayout,
      ),
    loadChildren: () =>
      import('../student/student.routes').then((m) => m.studentRoutes),
    canActivate: [authGuard, studentGuard],
  },
  {
    path: 'a',
    loadComponent: () =>
      import('./admin/layout/admin-layout/admin-layout').then(
        (m) => m.AdminLayout,
      ),
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
