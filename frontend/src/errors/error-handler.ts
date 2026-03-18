import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import LogRocket from 'logrocket';
import { getCurrentUser } from 'aws-amplify/auth';

@Injectable()
export class LogRocketErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        getCurrentUser().then(user => {

            // Invia l'errore a LogRocket
            if (user) {
                LogRocket.identify(user.userId || "anonymous", {
                    name: user.username || "anonymous"
                });
            }
            else LogRocket.identify('logged-out')
            LogRocket.captureException(error);
        })
    }
}