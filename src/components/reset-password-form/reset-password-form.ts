import { DatePipe } from '@angular/common';
import { Component, ViewChild, OnDestroy, DestroyRef } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaperPlane,
  faSpinnerThird,
  faCheck,
  faSave,
} from '@fortawesome/pro-solid-svg-icons';
import { CodeInputComponent, CodeInputModule } from 'angular-code-input';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  hasMinLenghthValidator,
  hasNumberValidator,
  hasSpecialCharValidator,
  passwordMatchValidator,
} from './form-validators';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-reset-password-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    RouterModule,
    DatePipe,
    CodeInputModule,
  ],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.scss',
})
export class ResetPasswordForm implements OnDestroy {
  SpinnerIcon = faSpinnerThird;
  PaperPlaneIcon = faPaperPlane;
  CheckIcon = faCheck;
  SaveIcon = faSave;

  hasResult: { success: boolean; message: string } | null = null;
  codeValiditySeconds: number = 0;

  currentStepIndex = new BehaviorSubject<number>(0);

  @ViewChild('codeInput') codeInput!: CodeInputComponent;

  constructor(
    private authService: Auth,
    private router: Router,
    private destroyRef: DestroyRef,
  ) {
    // Possiamo mantenere questo Observable perché è un BehaviorSubject interno
    this.currentStepIndex.subscribe((index) => {
      this.hasResult = null;
    });
  }

  sendEmailForm = new FormGroup({
    email: new FormControl('dimarcantonio.luigi@gmail.com', [
      Validators.required,
      Validators.email,
    ]),
  });

  checkCodeForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });

  resetPasswordForm = new FormGroup(
    {
      newPassword: new FormControl('123$Ciao', [
        Validators.required,
        hasMinLenghthValidator(8),
        hasSpecialCharValidator(),
        hasNumberValidator(),
      ]),
      confirmPassword: new FormControl('123$Ciao', [Validators.required]),
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
  );

  isValidMinLength(): boolean {
    const control = this.resetPasswordForm.get('newPassword');
    if (!control || !control.value) return false;
    return !control.hasError('hasMinLength') && control.value.length >= 8;
  }

  isValidSpecialChar(): boolean {
    const control = this.resetPasswordForm.get('newPassword');
    if (!control || !control.value) return false;
    return !control.hasError('hasSpecialChar');
  }

  isValidNumber(): boolean {
    const control = this.resetPasswordForm.get('newPassword');
    if (!control || !control.value) return false;
    return !control.hasError('hasNumber');
  }

  isValidPasswordMatch(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value;
    const confirm = this.resetPasswordForm.get('confirmPassword')?.value;
    if (!password || !confirm) return false;
    return !this.resetPasswordForm.hasError('passwordsMatch');
  }

  loading: boolean = false;
  async onSendEmail() {
    try {
      this.loading = true;
      const result = await firstValueFrom(
        this.authService.sendResetPasswordCode(
          this.sendEmailForm.controls['email'].value!,
        ),
      );
      console.log(result);
      this.hasResult = result;
      if (result.success) {
        setTimeout(() => {
          this.currentStepIndex.next(1);
          this.startCodeCountdown(result.codeValiditySeconds);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      this.hasResult = {
        success: false,
        message: "Errore durante l'invio del codice",
      };
    } finally {
      this.loading = false;
    }
  }

  countdownInterval: any;
  startCodeCountdown(duration: number = 5 * 60) {
    this.codeValiditySeconds = duration;
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      if (this.codeValiditySeconds > 0) {
        this.codeValiditySeconds--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 500);
  }

  sendingNewCode: boolean = false;
  onResendCode() {
    this.sendingNewCode = true;
    setTimeout(() => {
      this.sendingNewCode = false;
      this.startCodeCountdown(5 * 60);
      this.codeInput.reset();
    }, 500);
  }

  async onCheckCode() {
    try {
      this.loading = true;
      const result = await firstValueFrom(
        this.authService.checkResetPasswordCode(
          this.sendEmailForm.controls['email'].value!,
          this.checkCodeForm.controls['code'].value!,
        ),
      );
      console.log(result);
      this.hasResult = result;
      if (result.success) {
        setTimeout(() => {
          this.currentStepIndex.next(2);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking code:', error);
      this.hasResult = {
        success: false,
        message: 'Errore durante la verifica del codice',
      };
    } finally {
      this.loading = false;
    }
  }

  async onResetPassword() {
    try {
      this.loading = true;
      const result = await firstValueFrom(
        this.authService.resetPassword(
          this.sendEmailForm.controls['email'].value!,
          this.resetPasswordForm.controls['newPassword'].value!,
        ),
      );
      console.log(result);
      this.hasResult = result;
      if (result.success) {
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      this.hasResult = {
        success: false,
        message: 'Errore durante il reset della password',
      };
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    clearInterval(this.countdownInterval);
  }

  /* CODE INPUT HANDLERS */
  onCodeChanged(code: string) {
    this.checkCodeForm.controls['code'].setValue(code);
  }
  /* END CODE INPUT HANDLERS */
}
