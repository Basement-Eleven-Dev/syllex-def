import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-edit-email',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-email.html',
  styleUrl: './edit-email.scss',
})
export class EditEmail {
  step = signal<'email' | 'verification'>('email');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  newEmail = signal<string>('');

  emailForm = new FormGroup({
    newEmail: new FormControl('', [Validators.required, Validators.email]),
  });

  verificationForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor(
    public activeModal: NgbActiveModal,
    private authService: Auth,
  ) {}

  async onSubmitEmail(): Promise<void> {
    if (this.emailForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const newEmail = this.emailForm.value.newEmail!;
    const result = await this.authService.changeEmail(newEmail);

    this.isLoading.set(false);

    if (result.success) {
      this.newEmail.set(newEmail);
      this.step.set('verification');
    } else {
      this.errorMessage.set(result.message);
    }
  }

  async onSubmitVerification(): Promise<void> {
    if (this.verificationForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const code = this.verificationForm.value.code!;
    const result = await this.authService.verifyEmailChange(
      code,
      this.newEmail(),
    );

    this.isLoading.set(false);

    if (result.success) {
      this.activeModal.close('success');
    } else {
      this.errorMessage.set(result.message);
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
