import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import LogRocket from 'logrocket';

@Injectable()
export class LogRocketErrorHandler implements ErrorHandler {
    handleError(error: any): void {

        LogRocket.captureException(error);

    }
}