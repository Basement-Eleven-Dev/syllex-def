import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import LogRocket from 'logrocket';
import { Auth } from '../services/auth';

@Injectable()
export class LogRocketErrorHandler implements ErrorHandler {
    constructor(private injector: Injector) {

    }
    handleError(error: any): void {
        let auth = this.injector.get(Auth)
        let user = auth.user;
        // Invia l'errore a LogRocket
        if (user) {
            LogRocket.identify(user._id || "anonymous", {
                name: user.email || "anonymous"
            });
        }
        else LogRocket.identify('logged-out')
        LogRocket.captureException(error);
    }
}