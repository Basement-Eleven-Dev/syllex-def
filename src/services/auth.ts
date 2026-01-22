import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  /* 
    Invia email con codice di reset password
    Invalida il codice precedente se esiste
    @param email L'email dell'utente a cui inviare il codice
   */
  sendResetPasswordCode(email: string): Promise<{
    success: boolean;
    message: string;
    codeValiditySeconds: number;
  }> {
    return new Promise((resolve) => {
      // API call simulation
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Codice inviato con successo.',
          codeValiditySeconds: 300,
        });
      }, 1000);
    });
  }

  /* 
    Verifica il codice di reset password
    @param email L'email dell'utente a cui inviare il codice
    @param code Il codice di reset password da verificare
   */
  checkResetPasswordCode(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      // API call simulation
      setTimeout(() => {
        resolve({ success: false, message: 'Codice non valido.' });
      }, 1000);
    });
  }

  resetPassword(
    email: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      // API call simulation
      setTimeout(() => {
        resolve({ success: true, message: 'Password resettata con successo.' });
      }, 1000);
    });
  }
}
