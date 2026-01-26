import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return authService.user$.pipe(
    map((user) => {
      if (user) {
        // User is logged in
        return true;
      } else {
        // User is not logged in, redirect to login
        return router.createUrlTree(['/']);
      }
    }),
  );
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return authService.user$.pipe(
    map((user) => {
      if (!user) {
        // User is not logged in, allow access to auth pages
        return true;
      } else {
        // User is logged in, redirect to dashboard
        return router.createUrlTree(['/t']);
      }
    }),
  );
};
