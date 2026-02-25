import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    map(() => {
      const user = authService.user;
      if (!user) {
        return router.createUrlTree(['/']);
      }

      if (user.role === 'admin') {
        return true;
      }

      return router.createUrlTree(['/t']);
    }),
  );
};
