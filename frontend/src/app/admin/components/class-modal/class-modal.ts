import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faPlus, faCalendarAlt } from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-class-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './class-modal.html'
})
export class ClassModal {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);

  @Input() orgId!: string;
  @Input() title: string = 'Aggiungi Classe';

  classForm: FormGroup;
  loading = false;

  icons = {
    faUsers,
    faPlus,
    faCalendarAlt
  };

  constructor() {
    this.classForm = this.fb.group({
      name: ['', [Validators.required]],
      year: [new Date().getFullYear(), [Validators.required]]
    });
  }

  onSubmit() {
    if (this.classForm.invalid) return;

    this.loading = true;
    this.onboardingService.addClass(this.orgId, this.classForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.feedbackService.showFeedback('Classe creata con successo', true);
        this.activeModal.close(res);
      },
      error: () => {
        this.loading = false;
        this.feedbackService.showFeedback('Errore durante la creazione della classe', false);
      }
    });
  }
}
