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
  const subjectId = localStorage.getItem('selectedSubjectId') || undefined;
  
  // Costruiamo l'URL finale
  const apiUrl = req.url.startsWith('http')
    ? req.url
    : `${BACKEND_URL}/${req.url}`;

  // Se la richiesta NON è diretta al nostro backend, non aggiungiamo header di auth
  // e non proviamo nemmeno a recuperare la sessione (risparmiamo tempo).
  if (!apiUrl.startsWith(BACKEND_URL)) {
    return next(req.clone({ url: apiUrl }));
  }

  return from(fetchAuthSession()).pipe(
    switchMap((session) => {
      let token = session.tokens?.idToken?.toString();

      if (!token) {
        return next(req.clone({ url: apiUrl }));
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
