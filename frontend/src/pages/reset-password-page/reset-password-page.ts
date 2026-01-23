import { Component } from '@angular/core';
import { ResetPasswordForm } from '../../components/reset-password-form/reset-password-form';

@Component({
  selector: 'app-reset-password-page',
  imports: [ResetPasswordForm],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {}
