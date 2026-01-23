import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';
import { apiUrl as BACKEND_URL } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
) => {
  return from(fetchAuthSession()).pipe(
    switchMap((session) => {
      let token = session.tokens?.idToken?.toString();
      const apiUrl = req.url.startsWith('http')
        ? req.url
        : `${BACKEND_URL}/${req.url}`;

      if (!token) {
        const anonymousReq = req.clone({ url: apiUrl });
        return next(anonymousReq);
      }

      const authReq = req.clone({
        url: apiUrl,
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'User-Id': session.userSub || '',
        },
      });

      return next(authReq);
    }),
  );
};
