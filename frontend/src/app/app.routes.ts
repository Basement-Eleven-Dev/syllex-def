import { Routes } from '@angular/router';
import { LoginPage } from '../pages/login-page/login-page';
import { ResetPasswordPage } from '../pages/reset-password-page/reset-password-page';
import { TeacherLayout } from '../pages/teacher-layout/teacher-layout';
import { Dashboard } from '../pages/dashboard/dashboard';
import { Test } from '../pages/test/test';
import { authGuard, guestGuard } from '../guards/auth.guard';
import { Materiali } from '../pages/materiali/materiali';
import { TestDetail } from '../pages/test-detail/test-detail';
import { CreateEditTest } from '../pages/create-edit-test/create-edit-test';
import { Banca } from '../pages/banca/banca';
import { CreateEditQuestion } from '../pages/create-edit-question/create-edit-question';
import { Classi } from '../pages/classi/classi';
import { Comunicazioni } from '../pages/comunicazioni/comunicazioni';
import { ClasseDettaglio } from '../pages/classe-dettaglio/classe-dettaglio';
import { LaboratorioAi } from '../pages/laboratorio-ai/laboratorio-ai';
import { CreateEditComunicazione } from '../pages/create-edit-comunicazione/create-edit-comunicazione';

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
        path: 'banca',
        component: Banca,
      },
      {
        path: 'create-question',
        component: CreateEditQuestion,
      },
      {
        path: 'edit-question/:id',
        component: CreateEditQuestion,
      },
      {
        path: 'tests',
        component: Test,
      },
      {
        path: 'classi',
        component: Classi,
      },
      {
        path: 'classi/:classeId',
        component: ClasseDettaglio,
      },
      {
        path: 'comunicazioni',
        component: Comunicazioni,
      },
      {
        path: 'tests/new',
        component: CreateEditTest,
      },
      {
        path: 'tests/:testId',
        component: TestDetail,
      },
      {
        path: 'materiali',
        component: Materiali,
      },
      {
        path: 'comunicazioni',
        component: Comunicazioni,
      },
      {
        path: 'comunicazioni/new',
        component: CreateEditComunicazione,
      },
      {
        path: 'comunicazioni/edit/:comunicazioneId',
        component: CreateEditComunicazione,
      },
      {
        path: 'laboratorio-ai',
        component: LaboratorioAi,
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
