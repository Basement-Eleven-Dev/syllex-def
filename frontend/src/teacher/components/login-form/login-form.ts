import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignIn, faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule, RouterModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {
  LoginIcon = faSignIn;
  SpinnerIcon = faSpinnerThird;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  hasResult: { success: boolean; message: string } | null = null;
  isChallenge: boolean = false;
  challengeType: string | null = null;
  loading: boolean = false;

  constructor(
    private router: Router,
    private authService: Auth,
  ) {}

  onSingIn() {
    this.loading = true;
    const credentials = {
      username: this.loginForm.value.email || '',
      password: this.loginForm.value.password || '',
    };
    this.authService.login(credentials).then((result) => {
      this.loading = false;
      if (result.success && result.challenge === 'NEW_PASSWORD_REQUIRED') {
        this.isChallenge = true;
        this.challengeType = result.challenge;
        this.loginForm.get('password')?.setValue('');
        this.hasResult = { success: true, message: 'Inserisci una nuova password per completare l\'attivazione' };
        return;
      }
      
      this.hasResult = result;
      if (result.success) {
        this.handleSuccessfulLogin();
      }
    });
  }

  onConfirmChallenge() {
    this.loading = true;
    const newPass = this.loginForm.value.password || '';
    this.authService.confirmPassword(newPass).then((result) => {
      this.loading = false;
      this.hasResult = result;
      if (result.success) {
        this.handleSuccessfulLogin();
      }
    });
  }

  private handleSuccessfulLogin() {
    setTimeout(() => {
      const user = this.authService.user;
      if (user?.role === 'admin') {
        this.router.navigate(['/a']);
      } else if (user?.role === 'student') {
        this.router.navigate(['/s']);
      } else {
        this.router.navigate(['/t/dashboard']);
      }
    }, 1000);
  }
}
