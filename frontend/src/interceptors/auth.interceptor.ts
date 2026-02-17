import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
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
      const subjectId = localStorage.getItem('selectedSubjectId') || undefined;
      const apiUrl = req.url.startsWith('http')
        ? req.url
        : `${BACKEND_URL}/${req.url}`;

      if (!token) {
        const anonymousReq = req.clone({ url: apiUrl });
        return next(anonymousReq);
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      if (subjectId) {
        headers['Subject-Id'] = subjectId;
      }

      const authReq = req.clone({
        url: apiUrl,
        setHeaders: headers,
      });

      return next(authReq);
    }),
  );
};
