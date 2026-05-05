import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.whenReady;
  const user = auth.user;

  if (!user) return router.createUrlTree(['/']);
  if (user.role === 'admin') return true;
  return router.createUrlTree(['/t']);
};
