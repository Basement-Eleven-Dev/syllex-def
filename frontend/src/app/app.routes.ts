import { Routes } from '@angular/router';
import { LoginPage } from '../teacher/pages/login-page/login-page';
import { ResetPasswordPage } from '../teacher/pages/reset-password-page/reset-password-page';
import { TeacherLayout } from '../teacher/pages/teacher-layout/teacher-layout';
import { Dashboard } from '../teacher/pages/dashboard/dashboard';
import { Test } from '../teacher/pages/test/test';
import { authGuard, guestGuard } from '../guards/auth.guard';
import { Materiali } from '../teacher/pages/materiali/materiali';
import { TestDetail } from '../teacher/pages/test-detail/test-detail';
import { CreateEditTest } from '../teacher/pages/create-edit-test/create-edit-test';
import { Banca } from '../teacher/pages/banca/banca';
import { CreateEditQuestion } from '../teacher/pages/create-edit-question/create-edit-question';
import { Classi } from '../teacher/pages/classi/classi';
import { Comunicazioni } from '../teacher/pages/comunicazioni/comunicazioni';
import { ClasseDettaglio } from '../teacher/pages/classe-dettaglio/classe-dettaglio';
import { LaboratorioAi } from '../teacher/pages/laboratorio-ai/laboratorio-ai';
import { CreateEditComunicazione } from '../teacher/pages/create-edit-comunicazione/create-edit-comunicazione';
import { Correzione } from '../teacher/pages/correzione/correzione';
import { Profile } from '../teacher/pages/profile/profile';
import { AgentPage } from '../teacher/pages/agent-page/agent-page';

import { studentGuard } from '../guards/student.guard';
import { teacherGuard } from '../guards/teacher.guard';
import { StudentLayout } from '../student/pages/student-layout/student-layout';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage,
    canActivate: [guestGuard],
  },
  {
    path: 'password-reset',
    component: ResetPasswordPage,
    canActivate: [guestGuard],
  },
  {
    path: 't',
    component: TeacherLayout,
    canActivate: [authGuard, teacherGuard],
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
        path: 'tests/edit/:testId',
        component: CreateEditTest,
      },
      {
        path: 'tests/:testId',
        component: TestDetail,
      },
      {
        path: 'risorse',
        component: Materiali,
      },
      {
        path: 'correzione/:attemptId',
        component: Correzione,
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
        path: 'agente',
        component: AgentPage,
      },
      {
        path: 'profilo',
        component: Profile,
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 's',
    component: StudentLayout,
    canActivate: [authGuard, studentGuard],
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
        path: 'tests/edit/:testId',
        component: CreateEditTest,
      },
      {
        path: 'tests/:testId',
        component: TestDetail,
      },
      {
        path: 'risorse',
        component: Materiali,
      },
      {
        path: 'correzione/:attemptId',
        component: Correzione,
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
        path: 'agente',
        component: AgentPage,
      },
      {
        path: 'profilo',
        component: Profile,
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
