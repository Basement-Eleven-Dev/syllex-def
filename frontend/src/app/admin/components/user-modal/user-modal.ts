import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faUserTag, faPlus, faTimes, faBook, faUsers } from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './user-modal.html',
  styleUrl: './user-modal.scss'
})
export class UserModal {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);

  @Input() orgId!: string;
  @Input() title: string = 'Aggiungi Utente';
  @Input() fixedRole?: string;
  @Input() classes: any[] = [];
  @Input() subjects: any[] = [];
  @Input() user?: any; // Existing user for editing

  userForm: FormGroup;
  loading = false;

  icons = {
    faUser,
    faEnvelope,
    faUserTag,
    faPlus,
    faTimes,
    faBook,
    faUsers
  };

  isNewSubject = false;

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      classId: [''],
      subjectId: [''],
      newSubjectName: ['']
    });

    // Handle conditional validators based on role
    this.userForm.get('role')?.valueChanges.subscribe(role => {
        this.updateValidators(role);
    });
  }

  updateValidators(role: string) {
      const classCtrl = this.userForm.get('classId');
      const subCtrl = this.userForm.get('subjectId');
      const newSubCtrl = this.userForm.get('newSubjectName');

      classCtrl?.setValidators(role === 'student' ? [Validators.required] : []);
      
      this.updateTeacherValidators(role);

      classCtrl?.updateValueAndValidity();
  }

  toggleNewSubject() {
    this.isNewSubject = !this.isNewSubject;
    this.updateTeacherValidators(this.userForm.get('role')?.value);
  }

  private updateTeacherValidators(role: string) {
    const subCtrl = this.userForm.get('subjectId');
    const newSubCtrl = this.userForm.get('newSubjectName');

    if (role === 'teacher') {
      if (this.isNewSubject) {
        subCtrl?.setValidators([]);
        newSubCtrl?.setValidators([Validators.required]);
        subCtrl?.setValue('');
      } else {
        subCtrl?.setValidators([Validators.required]);
        newSubCtrl?.setValidators([]);
        newSubCtrl?.setValue('');
      }
    } else {
      subCtrl?.setValidators([]);
      newSubCtrl?.setValidators([]);
    }

    subCtrl?.updateValueAndValidity();
    newSubCtrl?.updateValueAndValidity();
  }

  ngOnInit() {
    if (this.fixedRole) {
      this.userForm.patchValue({ role: this.fixedRole });
    }
    
    if (this.user) {
        this.title = `Modifica ${this.user.firstName}`;
        this.userForm.patchValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            email: this.user.email,
            role: this.user.role,
            classId: this.user.classId || '',
            subjectId: this.user.subjectId || ''
        });
        // Disable email editing
        this.userForm.get('email')?.disable();
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.loading = true;
    const orgId = this.orgId;
    const userData = this.userForm.getRawValue(); // Get email even if disabled

    const request = this.user 
        ? this.onboardingService.updateUser(orgId, this.user._id, userData)
        : this.onboardingService.addUser(orgId, userData);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        const msg = this.user ? 'Utente aggiornato' : 'Utente aggiunto';
        this.feedbackService.showFeedback(msg, true);
        this.activeModal.close(res.user || res);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.status === 409 ? 'Email già esistente' : 'Errore durante l\'operazione';
        this.feedbackService.showFeedback(msg, false);
      }
    });
  }
}
