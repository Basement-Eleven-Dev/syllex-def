import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Amplify } from 'aws-amplify';
import {
  signIn,
  SignInInput,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';
import { HttpClient } from '@angular/common/http';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-south-1_xuHdZQr2t',
      userPoolClientId: '1k1ti85ci1bsvkak8ob683ehi2',
    },
  },
});

export interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'teacher' | 'student' | 'admin';
  organizationIds?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  user$ = new BehaviorSubject<User | null>(null);

  get user(): User | null {
    return this.user$.value;
  }

  constructor(private http: HttpClient) {
    this.checkCurrentUser();
  }
  /*
    Effettua il login dell'utente
    @param email L'email dell'utente
    @param password La password dell'utente
   */
  async login(
    credentials: SignInInput,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await signIn(credentials);
      await fetchAuthSession({ forceRefresh: true });

      const user = await firstValueFrom(
        this.http.post<User | null>('profile', null),
      );

      if (user) {
        this.user$.next(user);
        return { success: true, message: 'Login riuscito' };
      } else {
        return {
          success: false,
          message: 'Impossibile recuperare il profilo utente',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante il login',
      };
    }
  }

  private async checkCurrentUser(): Promise<void> {
    try {
      await getCurrentUser();
      this.fetchAndSetUser();
    } catch (error) {
      this.user$.next(null);
    }
  }

  private fetchAndSetUser(): void {
    this.http.post<User | null>('getMyProfile', null).subscribe({
      next: (user) => this.user$.next(user || null),
      error: () => this.user$.next(null),
    });
  }

  /* 
    @piero
    Invia email con codice di reset password
    Invalida il codice precedente se esiste
    @param email L'email dell'utente a cui inviare il codice
   */
  sendResetPasswordCode(email: string): Observable<{
    success: boolean;
    message: string;
    codeValiditySeconds: number;
  }> {
    return new Observable((observer) => {
      // API call simulation
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Codice verificato con successo.',
          codeValiditySeconds: 300,
        });
        observer.complete();
      }, 1500);
    });
  }

  /* 
    @piero
    Verifica il codice di reset password
    @param email L'email dell'utente a cui inviare il codice
    @param code Il codice di reset password da verificare
   */
  checkResetPasswordCode(
    email: string,
    code: string,
  ): Observable<{ success: boolean; message: string }> {
    return new Observable((observer) => {
      // API call simulation
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Codice verificato con successo.',
        });
        observer.complete();
      }, 1500);
    });
  }

  /* 
    @piero
    Reimposta la password dell'utente
    Viene chiamato dopo la verifica del codice
    @param email L'email dell'utente
    @param newPassword La nuova password da impostare
   */
  resetPassword(
    email: string,
    newPassword: string,
  ): Observable<{ success: boolean; message: string }> {
    return new Observable((observer) => {
      // API call simulation
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Password resettata con successo.',
        });
        observer.complete();
      }, 1500);
    });
  }
}
