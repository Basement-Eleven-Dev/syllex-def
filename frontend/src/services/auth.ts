import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Amplify } from 'aws-amplify';
import {
  signIn,
  SignInInput,
  fetchAuthSession,
  getCurrentUser,
  signOut,
  updatePassword,
  updateUserAttribute,
  confirmUserAttribute,
} from 'aws-amplify/auth';
import { HttpClient } from '@angular/common/http';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-south-1_IdnpEkSac',
      userPoolClientId: '7n2b7ueleckpvil3f7834oabsu',
    },
  },
});

export interface User {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'teacher' | 'student' | 'admin';
  organizationId: string;
}

export interface OrganizationInterface {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  organizationName$ = new BehaviorSubject<string | null>(null);
  user$ = new BehaviorSubject<User | null>(null);
  isInitialized = signal(false);

  get user(): User | null {
    return this.user$.value;
  }

  constructor(private http: HttpClient) {
    this.checkCurrentUser();
  }

  async login(
    credentials: SignInInput,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await signIn(credentials);
      await fetchAuthSession({ forceRefresh: true });

      const user = await firstValueFrom(this.http.get<User | null>('profile'));

      if (user) {
        this.user$.next(user);
        this.getOrganizationById(user!.organizationId);
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
      await this.fetchAndSetUser();
    } catch (error) {
      this.user$.next(null);
      this.isInitialized.set(true);
    }
  }

  private async fetchAndSetUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<User | null>('profile'));
      this.user$.next(user || null);
      this.getOrganizationById(user!.organizationId);
    } catch (error) {
      this.user$.next(null);
    } finally {
      this.isInitialized.set(true);
    }
  }

  getOrganizationById(organizationId: string) {
    this.http
      .get<OrganizationInterface>(`organizations/${organizationId}`)
      .subscribe((org) => {
        this.organizationName$.next(org.name);
      });
  }

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

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await signOut();
      this.user$.next(null);
      return { success: true, message: 'Logout riuscito' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante il logout',
      };
    }
  }

  async changeEmail(
    newEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await updateUserAttribute({
        userAttribute: {
          attributeKey: 'email',
          value: newEmail,
        },
      });
      return {
        success: true,
        message: 'Codice di verifica inviato alla nuova email',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Errore durante la modifica dell'email",
      };
    }
  }

  async verifyEmailChange(
    code: string,
    newEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await confirmUserAttribute({
        userAttributeKey: 'email',
        confirmationCode: code,
      });

      // Aggiorna lo user locale
      const currentUser = this.user$.value;
      if (currentUser) {
        this.user$.next({ ...currentUser, username: newEmail });
      }

      // Sincronizza con il database
      await firstValueFrom(
        this.http.patch('profile/email', { email: newEmail }),
      );

      return {
        success: true,
        message: 'Email aggiornata con successo',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Codice non valido',
      };
    }
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await updatePassword({ oldPassword, newPassword });
      return {
        success: true,
        message: 'Password aggiornata con successo',
      };
    } catch (error: any) {
      let message = 'Errore durante la modifica della password';
      if (error.name === 'NotAuthorizedException') {
        message = 'Password attuale non corretta';
      } else if (error.name === 'InvalidPasswordException') {
        message = 'La nuova password non rispetta i requisiti minimi';
      }
      return {
        success: false,
        message: error.message || message,
      };
    }
  }
}
