import { Routes } from '@angular/router';

export const teacherRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'banca',
    loadComponent: () => import('./pages/banca/banca').then((m) => m.Banca),
  },
  {
    path: 'create-question',
    loadComponent: () =>
      import('./pages/create-edit-question/create-edit-question').then(
        (m) => m.CreateEditQuestion,
      ),
  },
  {
    path: 'edit-question/:id',
    loadComponent: () =>
      import('./pages/create-edit-question/create-edit-question').then(
        (m) => m.CreateEditQuestion,
      ),
  },
  {
    path: 'tests',
    loadComponent: () => import('./pages/test/test').then((m) => m.Test),
  },
  {
    path: 'lessons',
    loadComponent: () =>
      import('./pages/lessons/lessons').then((m) => m.Lessons),
  },
  {
    path: 'classi',
    loadComponent: () => import('./pages/classi/classi').then((m) => m.Classi),
  },
  {
    path: 'classi/:classeId',
    loadComponent: () =>
      import('./pages/classe-dettaglio/classe-dettaglio').then(
        (m) => m.ClasseDettaglio,
      ),
  },
  {
    path: 'comunicazioni',
    loadComponent: () =>
      import('./pages/comunicazioni/comunicazioni').then(
        (m) => m.Comunicazioni,
      ),
  },
  {
    path: 'comunicazioni/new',
    loadComponent: () =>
      import('./pages/create-edit-comunicazione/create-edit-comunicazione').then(
        (m) => m.CreateEditComunicazione,
      ),
  },
  {
    path: 'comunicazioni/edit/:comunicazioneId',
    loadComponent: () =>
      import('./pages/create-edit-comunicazione/create-edit-comunicazione').then(
        (m) => m.CreateEditComunicazione,
      ),
  },
  {
    path: 'tests/new',
    loadComponent: () =>
      import('./pages/create-edit-test/create-edit-test').then(
        (m) => m.CreateEditTest,
      ),
  },
  {
    path: 'tests/edit/:testId',
    loadComponent: () =>
      import('./pages/create-edit-test/create-edit-test').then(
        (m) => m.CreateEditTest,
      ),
  },
  {
    path: 'tests/:testId',
    loadComponent: () =>
      import('./pages/test-detail/test-detail').then((m) => m.TestDetail),
  },
  {
    path: 'risorse',
    loadComponent: () =>
      import('./pages/materiali/materiali').then((m) => m.Materiali),
  },
  {
    path: 'correzione/:attemptId',
    loadComponent: () =>
      import('./pages/correzione/correzione').then((m) => m.Correzione),
  },
  {
    path: 'eventi',
    loadComponent: () => import('./pages/events/events').then((m) => m.Events),
  },
  {
    path: 'eventi/new',
    loadComponent: () =>
      import('./pages/create-edit-event/create-edit-event').then(
        (m) => m.CreateEditEvent,
      ),
  },
  {
    path: 'eventi/edit/:eventoId',
    loadComponent: () =>
      import('./pages/create-edit-event/create-edit-event').then(
        (m) => m.CreateEditEvent,
      ),
  },
  {
    path: 'laboratorio-ai',
    loadComponent: () =>
      import('./pages/laboratorio-ai/laboratorio-ai').then(
        (m) => m.LaboratorioAi,
      ),
  },
  {
    path: 'agente',
    loadComponent: () =>
      import('./pages/agent-page/agent-page').then((m) => m.AgentPage),
  },
  {
    path: 'profilo',
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'student/:studentId/class/:classeId',
    loadComponent: () =>
      import('./pages/student-detail/student-detail').then(
        (m) => m.StudentDetail,
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
