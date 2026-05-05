import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';

export const teacherGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.whenReady;
  const user = auth.user;

  if (!user) return router.createUrlTree(['/']);
  if (user.role === 'teacher') return true;
  if (user.role === 'admin') return router.createUrlTree(['/a']);
  return router.createUrlTree(['/s']);
};
