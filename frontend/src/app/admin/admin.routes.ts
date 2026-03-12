import { Routes } from '@angular/router';
import { superadminGuard } from '../../guards/superadmin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboard,
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./pages/admin-onboarding/admin-onboarding').then(
        (m) => m.AdminOnboarding,
      ),
    canActivate: [superadminGuard],
  },
  {
    path: 'organizzazioni',
    loadComponent: () =>
      import('./pages/admin-organizations/admin-organizations').then(
        (m) => m.AdminOrganizations,
      ),
  },
  {
    path: 'organizzazioni/:id',
    loadComponent: () =>
      import('./pages/admin-organization-detail/admin-organization-detail').then(
        (m) => m.AdminOrganizationDetail,
      ),
  },
  {
    path: 'organizzazioni/:orgId/classi/:classId',
    loadComponent: () =>
      import('./pages/admin-class-detail/admin-class-detail').then(
        (m) => m.AdminClassDetail,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/admin-profile/admin-profile').then((m) => m.AdminProfile),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/admin-stats/admin-stats').then((m) => m.AdminStats),
  },
];
