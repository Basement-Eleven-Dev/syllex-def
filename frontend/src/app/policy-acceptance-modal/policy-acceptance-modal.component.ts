import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { FeedbackService } from '../../services/feedback-service';
import { TermsTeacherContentComponent } from './terms-teacher-content.component';
import { TermsStudentContentComponent } from './terms-student-content.component';
import { TERMS_VERSION } from '../_utils/terms-version';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [FormsModule, TermsTeacherContentComponent, TermsStudentContentComponent],
  templateUrl: './policy-acceptance-modal.component.html',
  styleUrl: './policy-acceptance-modal.component.scss',
})
export class TermsModalComponent {
  activeModal = inject(NgbActiveModal);
  private authService = inject(Auth);
  private feedbackService = inject(FeedbackService);

  role = this.authService.user?.role;

  termsAccepted = false;
  loading = signal(false);

  async confirm() {
    this.loading.set(true);
    const result = await this.authService.acceptTerms(TERMS_VERSION);
    this.loading.set(false);

    if (result.success) {
      this.activeModal.close('accepted');
    } else {
      this.feedbackService.showFeedback(result.message, false);
    }
  }
}
