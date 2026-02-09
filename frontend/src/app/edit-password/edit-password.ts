import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../services/auth';
import { FeedbackService } from '../../services/feedback-service';
import { faEye, faEyeSlash, faSpinnerThird } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-edit-password',
  imports: [ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './edit-password.html',
  styleUrl: './edit-password.scss',
})
export class EditPassword {
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  SpinnerIcon = faSpinnerThird;
  EyeIcon = faEye;
  EyeSlashIcon = faEyeSlash;

  passwordForm = new FormGroup(
    {
      oldPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordMatchValidator },
  );

  constructor(
    public activeModal: NgbActiveModal,
    private authService: Auth,
    private feedbackService: FeedbackService,
  ) {}

  passwordMatchValidator(
    control: AbstractControl,
  ): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { oldPassword, newPassword } = this.passwordForm.value;
    const result = await this.authService.changePassword(
      oldPassword!,
      newPassword!,
    );

    this.isLoading.set(false);

    if (result.success) {
      this.activeModal.close('success');
      this.feedbackService.showFeedback('Password cambiata con successo', true);
    } else {
      this.errorMessage.set(result.message);
      this.feedbackService.showFeedback(result.message, false);
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  togglePasswordVisibility(field: 'old' | 'new' | 'confirm'): void {
    if (field === 'old') {
      this.showOldPassword.update((v) => !v);
    } else if (field === 'new') {
      this.showNewPassword.update((v) => !v);
    } else {
      this.showConfirmPassword.update((v) => !v);
    }
  }
}
