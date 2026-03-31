import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
  ErrorHandler,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { provideMarkdown } from 'ngx-markdown';
import { TourNgBootstrapModule } from 'ngx-ui-tour-ng-bootstrap';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { LogRocketErrorHandler } from '../errors/error-handler';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: ({ transition }) => {
          if (document.body.classList.contains('tour-active')) {
            transition.skipTransition();
          }
        },
      })
    ),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideMarkdown(),
    provideCharts(withDefaultRegisterables()),
    { provide: ErrorHandler, useClass: LogRocketErrorHandler },
    importProvidersFrom(TourNgBootstrapModule),
  ],
};
