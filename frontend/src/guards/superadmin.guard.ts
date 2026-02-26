import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { Auth } from '../services/auth';

export const superadminGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    map(() => {
      if (authService.isSuperAdmin) {
        return true;
      }

      // If not superadmin, redirect to admin dashboard
      return router.createUrlTree(['/a/dashboard']);
    }),
  );
};
