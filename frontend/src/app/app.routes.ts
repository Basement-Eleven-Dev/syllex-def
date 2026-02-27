import { Routes } from '@angular/router';
import { LoginPage } from '../teacher/pages/login-page/login-page';
import { ResetPasswordPage } from '../teacher/pages/reset-password-page/reset-password-page';
import { TeacherLayout } from '../teacher/pages/teacher-layout/teacher-layout';
import { Dashboard } from '../teacher/pages/dashboard/dashboard';
import { Test } from '../teacher/pages/test/test';
import { authGuard, guestGuard } from '../guards/auth.guard';
import { Materiali } from '../teacher/pages/materiali/materiali';
import { Materiali as MaterialiStudent } from '../student/pages/materiali/materiali';
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
import { StudentTestExecution } from '../student/pages/student-test-execution/student-test-execution';
import { StudentTestReview } from '../student/pages/student-test-review/student-test-review';
import { Events } from '../teacher/pages/events/events';
import { CreateEditEvent } from '../teacher/pages/create-edit-event/create-edit-event';
import { StudentTestsList } from '../student/pages/student-tests-list/student-tests-list';
import { testExecutionGuard } from '../guards/test-execution.guard';
import { StudentComunicazioni } from '../student/pages/student-comunicazioni/student-comunicazioni';
import { StudentCreateTest } from '../student/pages/student-create-test/student-create-test';

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
        path: 'eventi',
        component: Events,
      },
      {
        path: 'eventi/new',
        component: CreateEditEvent,
      },
      {
        path: 'eventi/edit/:eventoId',
        component: CreateEditEvent,
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
        path: 'student/:studentId/class/:classeId',
        loadComponent: () => import('../teacher/pages/student-detail/student-detail').then(m => m.StudentDetail),
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
        component: StudentTestsList,
      },
      {
        path: 'tests/execute/:testId',
        component: StudentTestExecution,
        canDeactivate: [testExecutionGuard],
      },
      {
        path: 'tests/review/:testId',
        component: StudentTestReview,
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
        component: StudentComunicazioni,
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
        component: MaterialiStudent,
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
        path: 'auto-evaluation/create',
        component: StudentCreateTest,
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
