import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportsService } from '../../../services/reports-service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-report-bug-form',
  imports: [ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './report-bug-form.html',
  styleUrl: './report-bug-form.scss',
})
export class ReportBugForm {
  private readonly reportsService = inject(ReportsService);
  private readonly feedbackService = inject(FeedbackService);
  readonly activeModal = inject(NgbActiveModal);

  readonly SpinnerIcon = faSpinnerThird;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly commentControl = new FormControl('', [
    Validators.required,
    Validators.minLength(10),
    Validators.maxLength(1000),
  ]);

  get isFormValid(): boolean {
    return this.commentControl.valid && !this.isSubmitting();
  }

  submit(): void {
    if (!this.isFormValid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.reportsService
      .createReport({
        comment: this.commentControl.value!,
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
      .subscribe({
        next: () => {
          this.feedbackService.showFeedback(
            'Segnalazione inviata con successo. Grazie per il tuo feedback!',
            true,
          );
          this.activeModal.close('submitted');
        },
        error: (err) => {
          console.error("Errore durante l'invio del report:", err);
          this.errorMessage.set(
            'Si è verificato un errore. Riprova più tardi.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  cancel(): void {
    this.activeModal.dismiss('cancelled');
  }
}
