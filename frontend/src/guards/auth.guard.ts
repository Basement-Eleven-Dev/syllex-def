import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.whenReady;
  return auth.user ? true : router.createUrlTree(['/']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.whenReady;
  const user = auth.user;

  if (!user) return true;

  if (user.role === 'admin') return router.createUrlTree(['/a']);
  if (user.role === 'student') return router.createUrlTree(['/s']);
  return router.createUrlTree(['/t']);
};
