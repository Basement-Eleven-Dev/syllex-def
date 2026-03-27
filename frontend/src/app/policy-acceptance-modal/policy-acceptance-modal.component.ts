import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { FeedbackService } from '../../services/feedback-service';

@Component({
  selector: 'app-policy-acceptance-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-header border-0 pb-0">
      <h5 class="modal-title fw-semibold">Accettazione politiche d'uso</h5>
    </div>
    <div class="modal-body">
      <p class="text-muted mb-4">
        Per accedere alla piattaforma è necessario accettare le seguenti
        politiche.
      </p>

      <div class="form-check mb-3">
        <input
          class="form-check-input"
          type="checkbox"
          id="privacyPolicy"
          [(ngModel)]="privacyAccepted"
        />
        <label class="form-check-label" for="privacyPolicy">
          Ho letto e accetto la
          <a
            href="https://www.syllex.it/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </label>
      </div>

      <div class="form-check mb-4">
        <input
          class="form-check-input"
          type="checkbox"
          id="aiPolicy"
          [(ngModel)]="aiAccepted"
        />
        <label class="form-check-label" for="aiPolicy">
          Ho letto e accetto la
          <a
            href="https://www.syllex.it/ai-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Politica sull'utilizzo dell'intelligenza artificiale
          </a>
        </label>
      </div>
    </div>
    <div class="modal-footer border-0">
      <button
        type="button"
        class="btn btn-primary w-100"
        [disabled]="!privacyAccepted || !aiAccepted || loading()"
        (click)="confirm()"
      >
        @if (loading()) {
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
          ></span>
        }
        Accetta e continua
      </button>
    </div>
  `,
  styles: [
    `
      .modal-header,
      .modal-footer {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
      .modal-body {
        padding: 1rem 1.5rem;
      }
    `,
  ],
})
export class PolicyAcceptanceModalComponent {
  activeModal = inject(NgbActiveModal);
  private authService = inject(Auth);
  private feedbackService = inject(FeedbackService);

  privacyAccepted = false;
  aiAccepted = false;
  loading = signal(false);

  async confirm() {
    if (!this.privacyAccepted || !this.aiAccepted) return;

    this.loading.set(true);
    const result = await this.authService.acceptPolicies();
    this.loading.set(false);

    if (result.success) {
      this.activeModal.close('accepted');
    } else {
      this.feedbackService.showFeedback(result.message, false);
    }
  }
}
