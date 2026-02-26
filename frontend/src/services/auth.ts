import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
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
  resetPassword,
  confirmResetPassword,
  confirmSignIn,
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
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'teacher' | 'student' | 'admin';
  organizationId?: string;
  organizationIds?: string[];
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
    const user = this.user$.value;
    if (!user) return null;
    
    const impersonatedOrgId = localStorage.getItem('impersonatedOrgId');
    if (impersonatedOrgId && this.isSuperAdminInternal(user)) {
      return { ...user, organizationId: impersonatedOrgId };
    }
    
    return user;
  }

  private isSuperAdminInternal(user: User): boolean {
    return user.role === 'admin' && !user.organizationId && (!user.organizationIds || user.organizationIds.length === 0);
  }

  get isSuperAdmin(): boolean {
    const user = this.user$.value; // Use raw value for checking role
    if (!user || user.role !== 'admin') return false;
    return !user.organizationId && (!user.organizationIds || user.organizationIds.length === 0);
  }

  get isImpersonating(): boolean {
    return !!localStorage.getItem('impersonatedOrgId');
  }

  impersonate(orgId: string) {
    localStorage.setItem('impersonatedOrgId', orgId);
    window.location.reload();
  }

  stopImpersonating() {
    localStorage.removeItem('impersonatedOrgId');
    window.location.reload();
  }

  constructor(private http: HttpClient) {
    this.checkCurrentUser();
  }

  async login(
    credentials: SignInInput,
  ): Promise<{ success: boolean; message: string; challenge?: string }> {
    try {
      const { nextStep } = await signIn(credentials);

      if (nextStep.signInStep === 'DONE') {
        await fetchAuthSession({ forceRefresh: true });
        const user = await firstValueFrom(this.http.get<User | null>('profile'));

          if (user) {
            this.user$.next(user);
            const orgId = user.organizationId || user.organizationIds?.[0];
            if (orgId) {
              this.getOrganizationById(orgId);
            }
            return { success: true, message: 'Login riuscito' };
          } else {
            return {
              success: false,
              message: 'Impossibile recuperare il profilo utente',
            };
        }
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return {
          success: true,
          message: 'Nuova password richiesta',
          challenge: 'NEW_PASSWORD_REQUIRED',
        };
      } else {
        return {
          success: false,
          message: `Step di login non supportato: ${nextStep.signInStep}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Errore durante il login',
      };
    }
  }

  async confirmPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const { nextStep } = await confirmSignIn({ challengeResponse: newPassword });
      
      if (nextStep.signInStep === 'DONE') {
        await fetchAuthSession({ forceRefresh: true });
        const user = await firstValueFrom(this.http.get<User | null>('profile'));
        if (user) {
          this.user$.next(user);
          return { success: true, message: 'Password aggiornata e login effettuato' };
        }
      }
      return { success: false, message: 'Errore durante la conferma della password' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Errore durante il cambio password' };
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
      const orgId = user?.organizationId || user?.organizationIds?.[0];
      if (orgId) {
        this.getOrganizationById(orgId);
      }
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

  async sendResetPasswordCode(
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
    codeValiditySeconds: number;
  }> {
    try {
      const output = await resetPassword({ username: email });

      if (
        output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        return {
          success: true,
          message: 'Codice inviato alla tua email',
          codeValiditySeconds: 300,
        };
      }

      return {
        success: false,
        message: "Errore durante l'invio del codice",
        codeValiditySeconds: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Errore durante l'invio del codice",
        codeValiditySeconds: 0,
      };
    }
  }

  async confirmResetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });

      return {
        success: true,
        message: 'Password resettata con successo',
      };
    } catch (error: any) {
      let message = 'Errore durante il reset della password';

      if (error.name === 'CodeMismatchException') {
        message = 'Codice non valido';
      } else if (error.name === 'ExpiredCodeException') {
        message = 'Codice scaduto';
      } else if (error.name === 'InvalidPasswordException') {
        message = 'La password non rispetta i requisiti minimi';
      }

      return {
        success: false,
        message: error.message || message,
      };
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await signOut();
      this.user$.next(null);
      window.location.reload();
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
