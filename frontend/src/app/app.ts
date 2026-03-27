import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbToastModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeedbackService } from '../services/feedback-service';
import { Auth } from '../services/auth';
import { TermsModalComponent } from './policy-acceptance-modal/policy-acceptance-modal.component';
import { TERMS_VERSION } from './_utils/terms-version';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgbToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Syllex';
  protected readonly feedbackService = inject(FeedbackService);
  protected readonly authService = inject(Auth);
  private readonly modalService = inject(NgbModal);
  private termsModalOpen = false;

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (!user) return;
      const needsAcceptance = user.termsAcceptation?.version !== TERMS_VERSION;
      if (needsAcceptance && !this.termsModalOpen) {
        this.openPolicyModal();
      }
    });
  }

  private openPolicyModal() {
    this.termsModalOpen = true;
    const ref = this.modalService.open(TermsModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });
    ref.result.then(() => {
      this.termsModalOpen = false;
    });
  }
}
