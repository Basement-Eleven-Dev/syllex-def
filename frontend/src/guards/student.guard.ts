import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, filter } from 'rxjs/operators';
import { Auth } from '../services/auth';
import { toObservable } from '@angular/core/rxjs-interop';

export const studentGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    map(() => {
      const user = authService.user;
      if (!user) {
        return router.createUrlTree(['/']);
      }

      if (user.role === 'student') {
        return true;
      }

      return router.createUrlTree(['/t']);
    }),
  );
};
