import { Component } from '@angular/core';
import { LoginForm } from '../../components/login-form/login-form';
import { StackedIcon } from '../../components/stacked-icon/stacked-icon';
import { fa1, fa2, faKey, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-login-page',
  imports: [LoginForm, TranslocoDirective],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  primaryIcon = faKey;
  secondary = faPlus;
}
