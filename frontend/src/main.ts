/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import LogRocket from 'logrocket';
import { logRocketId } from './environments/environment';

LogRocket.init(logRocketId);
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
