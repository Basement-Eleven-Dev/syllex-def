import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserTie, faBook, faPlus, faTimes, faUsers } from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-assignment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './assignment-modal.html',
  styleUrl: './assignment-modal.scss'
})
export class AssignmentModal implements OnInit {
  private fb = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);
  public activeModal = inject(NgbActiveModal);

  @Input() orgId!: string;
  @Input() classId!: string;
  @Input() fixedTeacherId?: string;

  assignmentForm: FormGroup;
  teachers: any[] = [];
  subjects: any[] = [];
  classes: any[] = [];
  loading = false;
  dataLoading = true;

  icons = {
    faUserTie,
    faBook,
    faPlus,
    faTimes,
    faUsers
  };

  constructor() {
    this.assignmentForm = this.fb.group({
      teacherId: ['', [Validators.required]],
      subjectId: ['', [Validators.required]],
      classId: ['']
    });
  }

  ngOnInit() {
    if (this.fixedTeacherId) {
        this.assignmentForm.patchValue({ teacherId: this.fixedTeacherId });
    }
    if (this.classId) {
        this.assignmentForm.patchValue({ classId: this.classId });
    } else {
        this.assignmentForm.get('classId')?.setValidators([Validators.required]);
    }
    this.loadData();
  }

  loadData() {
    this.dataLoading = true;
    this.onboardingService.getWorkspaceDidactics(this.orgId).subscribe({
      next: (res) => {
        this.subjects = res.subjects;
        this.classes = res.classes;
        this.loadStaff();
      },
      error: () => {
        this.feedbackService.showFeedback('Errore caricamento materie', false);
        this.dataLoading = false;
      }
    });
  }

  loadStaff() {
    this.onboardingService.getWorkspaceStaff(this.orgId).subscribe({
      next: (res) => {
        this.teachers = res.staff.filter((u: any) => u.role === 'teacher');
        this.dataLoading = false;
      },
      error: () => {
        this.feedbackService.showFeedback('Errore caricamento docenti', false);
        this.dataLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.assignmentForm.invalid) return;

    this.loading = true;
    const payload = { ...this.assignmentForm.value };

    this.onboardingService.addAssignment(this.orgId, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.feedbackService.showFeedback('Assegnazione creata con successo', true);
        this.activeModal.close(res);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Errore durante l\'assegnazione';
        this.feedbackService.showFeedback(msg, false);
      }
    });
  }
}
