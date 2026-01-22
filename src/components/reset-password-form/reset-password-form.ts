import { DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPaperPlane,
  faSpinnerThird,
  faCheck,
} from '@fortawesome/pro-solid-svg-icons';
import { CodeInputComponent, CodeInputModule } from 'angular-code-input';
import { BehaviorSubject } from 'rxjs';

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
export class ResetPasswordForm {
  SpinnerIcon = faSpinnerThird;
  PaperPlaneIcon = faPaperPlane;
  CheckIcon = faCheck;

  hasResult: { success: boolean; message: string } | null = null;
  codeValiditySeconds: number = 0;

  @ViewChild('codeInput') codeInput!: CodeInputComponent;

  constructor() {
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

  resetPasswordForm = new FormGroup({
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  currentStepIndex = new BehaviorSubject<number>(2);

  loading: boolean = false;
  onSendEmail() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.hasResult = {
        success: true,
        message: 'Email inviata con successo!',
      };

      setTimeout(() => {
        this.currentStepIndex.next(1);
        this.startCodeCountdown(5 * 60);
      }, 1500);
    }, 3000);
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
    }, 1000);
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

  checkingCode: boolean = false;
  onCheckCode() {
    // Placeholder for code verification logic
  }

  resettingPassword: boolean = false;
  onResetPassword() {
    // Placeholder for password reset logic
  }

  /* CODE INPUT HANDLERS */
  onCodeChanged(code: string) {
    this.checkCodeForm.controls['code'].setValue(code);
  }
  /* END CODE INPUT HANDLERS */
}
