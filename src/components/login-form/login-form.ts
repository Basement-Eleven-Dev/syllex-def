import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignIn, faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';

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

  loggingIn: boolean = false;

  onSingIn() {
    this.loggingIn = true;
    setTimeout(() => {
      this.loggingIn = false;
    }, 2000);
  }
}
