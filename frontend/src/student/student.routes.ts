import { Routes } from '@angular/router';
import { testExecutionGuard } from '../guards/test-execution.guard';

export const studentRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashbaord/student-dashboard').then(
        (m) => m.StudentDashboard,
      ),
  },
  {
    path: 'banca',
    loadComponent: () =>
      import('../teacher/pages/banca/banca').then((m) => m.Banca),
  },
  {
    path: 'create-question',
    loadComponent: () =>
      import('../teacher/pages/create-edit-question/create-edit-question').then(
        (m) => m.CreateEditQuestion,
      ),
  },
  {
    path: 'edit-question/:id',
    loadComponent: () =>
      import('../teacher/pages/create-edit-question/create-edit-question').then(
        (m) => m.CreateEditQuestion,
      ),
  },
  {
    path: 'tests',
    loadComponent: () =>
      import('./pages/student-tests-list/student-tests-list').then(
        (m) => m.StudentTestsList,
      ),
  },
  {
    path: 'tests/execute/:testId',
    loadComponent: () =>
      import('./pages/student-test-execution/student-test-execution').then(
        (m) => m.StudentTestExecution,
      ),
    canDeactivate: [testExecutionGuard],
  },
  {
    path: 'tests/review/:testId',
    loadComponent: () =>
      import('./pages/student-test-review/student-test-review').then(
        (m) => m.StudentTestReview,
      ),
  },
  {
    path: 'classi',
    loadComponent: () =>
      import('../teacher/pages/classi/classi').then((m) => m.Classi),
  },
  {
    path: 'classi/:classeId',
    loadComponent: () =>
      import('../teacher/pages/classe-dettaglio/classe-dettaglio').then(
        (m) => m.ClasseDettaglio,
      ),
  },
  {
    path: 'comunicazioni',
    loadComponent: () =>
      import('./pages/student-comunicazioni/student-comunicazioni').then(
        (m) => m.StudentComunicazioni,
      ),
  },
  {
    path: 'comunicazioni/new',
    loadComponent: () =>
      import('../teacher/pages/create-edit-comunicazione/create-edit-comunicazione').then(
        (m) => m.CreateEditComunicazione,
      ),
  },
  {
    path: 'comunicazioni/edit/:comunicazioneId',
    loadComponent: () =>
      import('../teacher/pages/create-edit-comunicazione/create-edit-comunicazione').then(
        (m) => m.CreateEditComunicazione,
      ),
  },
  {
    path: 'tests/new',
    loadComponent: () =>
      import('../teacher/pages/create-edit-test/create-edit-test').then(
        (m) => m.CreateEditTest,
      ),
  },
  {
    path: 'tests/edit/:testId',
    loadComponent: () =>
      import('../teacher/pages/create-edit-test/create-edit-test').then(
        (m) => m.CreateEditTest,
      ),
  },
  {
    path: 'tests/:testId',
    loadComponent: () =>
      import('../teacher/pages/test-detail/test-detail').then(
        (m) => m.TestDetail,
      ),
  },
  {
    path: 'risorse',
    loadComponent: () =>
      import('./pages/materiali/materiali').then((m) => m.Materiali),
  },
  {
    path: 'correzione/:attemptId',
    loadComponent: () =>
      import('../teacher/pages/correzione/correzione').then(
        (m) => m.Correzione,
      ),
  },
  {
    path: 'auto-evaluation/create',
    loadComponent: () =>
      import('./pages/student-create-test/student-create-test').then(
        (m) => m.StudentCreateTest,
      ),
  },
  {
    path: 'laboratorio-ai',
    loadComponent: () =>
      import('../teacher/pages/laboratorio-ai/laboratorio-ai').then(
        (m) => m.LaboratorioAi,
      ),
  },
  {
    path: 'agente',
    loadComponent: () =>
      import('../teacher/pages/agent-page/agent-page').then((m) => m.AgentPage),
  },
  {
    path: 'profilo',
    loadComponent: () =>
      import('../teacher/pages/profile/profile').then((m) => m.Profile),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
