import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faPlus, faUserTie, faUser, faEnvelope } from '@fortawesome/pro-solid-svg-icons';
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
    faUserTie,
    faUser,
    faEnvelope
  };

  isNewTeacher = false;

  constructor() {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required]],
      teacherId: ['', [Validators.required]],
      newTeacherData: this.fb.group({
        firstName: [''],
        lastName: [''],
        email: ['', [Validators.email]]
      })
    });
  }

  toggleNewTeacher() {
    this.isNewTeacher = !this.isNewTeacher;
    const teacherIdCtrl = this.subjectForm.get('teacherId');
    const newTeacherGrp = this.subjectForm.get('newTeacherData');

    if (this.isNewTeacher) {
      teacherIdCtrl?.setValidators([]);
      teacherIdCtrl?.setValue('');
      newTeacherGrp?.get('firstName')?.setValidators([Validators.required]);
      newTeacherGrp?.get('lastName')?.setValidators([Validators.required]);
      newTeacherGrp?.get('email')?.setValidators([Validators.required, Validators.email]);
    } else {
      teacherIdCtrl?.setValidators([Validators.required]);
      newTeacherGrp?.get('firstName')?.setValidators([]);
      newTeacherGrp?.get('lastName')?.setValidators([]);
      newTeacherGrp?.get('email')?.setValidators([Validators.email]);
      newTeacherGrp?.patchValue({ firstName: '', lastName: '', email: '' });
    }

    teacherIdCtrl?.updateValueAndValidity();
    newTeacherGrp?.get('firstName')?.updateValueAndValidity();
    newTeacherGrp?.get('lastName')?.updateValueAndValidity();
    newTeacherGrp?.get('email')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.subjectForm.invalid) return;

    this.loading = true;
    const payload = { ...this.subjectForm.value };
    if (!this.isNewTeacher) {
      delete payload.newTeacherData;
    } else {
      delete payload.teacherId;
    }

    this.onboardingService.addSubject(this.orgId, payload).subscribe({
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
