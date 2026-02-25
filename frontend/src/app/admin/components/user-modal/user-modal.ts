import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faUserTag, faPlus, faTimes } from '@fortawesome/pro-solid-svg-icons';
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

  userForm: FormGroup;
  loading = false;

  icons = {
    faUser,
    faEnvelope,
    faUserTag,
    faPlus,
    faTimes
  };

  constructor() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.fixedRole) {
      this.userForm.patchValue({ role: this.fixedRole });
    }
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.loading = true;
    this.onboardingService.addUser(this.orgId, this.userForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.feedbackService.showFeedback('Utente aggiunto con successo', true);
        this.activeModal.close(res.user);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.status === 409 ? 'Email già esistente' : 'Errore durante la creazione';
        this.feedbackService.showFeedback(msg, false);
      }
    });
  }
}
