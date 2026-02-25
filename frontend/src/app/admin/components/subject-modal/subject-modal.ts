import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faPlus, faUserTie } from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-subject-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './subject-modal.html'
})
export class SubjectModal {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);

  @Input() orgId!: string;
  @Input() teachers: any[] = [];
  @Input() title: string = 'Aggiungi Materia';

  subjectForm: FormGroup;
  loading = false;

  icons = {
    faBook,
    faPlus,
    faUserTie
  };

  constructor() {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required]],
      teacherId: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.subjectForm.invalid) return;

    this.loading = true;
    this.onboardingService.addSubject(this.orgId, this.subjectForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.feedbackService.showFeedback('Materia creata con successo', true);
        this.activeModal.close(res);
      },
      error: () => {
        this.loading = false;
        this.feedbackService.showFeedback('Errore durante la creazione della materia', false);
      }
    });
  }
}
