import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { Auth } from '../services/auth';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    map(() => {
      const user = authService.user;
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

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    map(() => {
      const user = authService.user;
      if (!user) {
        // User is not logged in, allow access to auth pages
        return true;
      } else {
        // User is logged in, redirect to appropriate dashboard
        const role = user.role;
        if (role === 'admin') {
          return router.createUrlTree(['/a']);
        } else if (role === 'student') {
          return router.createUrlTree(['/s']);
        }
        return router.createUrlTree(['/t']);
      }
    }),
  );
};
