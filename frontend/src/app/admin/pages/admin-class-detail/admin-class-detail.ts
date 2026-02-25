import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faUsers, 
  faArrowLeft, 
  faUserTie, 
  faBook, 
  faUser, 
  faCalendarAlt,
  faPlus,
  faFileImport,
  faEllipsisV,
  faEdit,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';
import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { BulkImportModal } from '../../components/bulk-import-modal/bulk-import-modal';

@Component({
  selector: 'app-admin-class-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, NgbDropdownModule],
  templateUrl: './admin-class-detail.html',
  styleUrl: './admin-class-detail.scss',
})
export class AdminClassDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);
  private modalService = inject(NgbModal);

  orgId: string | null = null;
  classId: string | null = null;
  classData: any = null;
  students: any[] = [];
  assignments: any[] = [];
  loading = true;

  icons = {
    faUsers,
    faArrowLeft,
    faUserTie,
    faBook,
    faUser,
    faCalendarAlt,
    faPlus,
    faFileImport,
    faEllipsisV,
    faEdit,
    faTrash
  };

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('orgId');
    this.classId = this.route.snapshot.paramMap.get('classId');
    if (this.orgId && this.classId) {
      this.loadClassDetail();
    }
  }

  loadClassDetail() {
    this.loading = true;
    this.onboardingService.getClassDetail(this.orgId!, this.classId!).subscribe({
      next: (res) => {
        this.classData = res.class;
        this.students = res.students;
        this.assignments = res.assignments;
        this.loading = false;
      },
      error: (err) => {
        this.feedbackService.showFeedback('Errore nel caricamento dei dettagli classe', false);
        this.loading = false;
      }
    });
  }

  openBulkImport() {
    const modalRef = this.modalService.open(BulkImportModal, { centered: true, size: 'lg' });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.targetClassId = this.classId;
    modalRef.componentInstance.classes = [this.classData]; // Solo questa classe
    modalRef.result.then((success) => {
        if (success) {
            this.loadClassDetail();
        }
    }, () => {});
  }

  removeUser(userId: string) {
    if (confirm('Sei sicuro di voler rimuovere questo studente dalla classe?')) {
        // Here removeUser removes from organization, which is fine since students belong to classes inside orbits
        this.onboardingService.removeUser(this.orgId!, userId).subscribe({
            next: () => {
                this.feedbackService.showFeedback('Studente rimosso con successo', true);
                this.students = this.students.filter(s => s._id !== userId);
            },
            error: () => this.feedbackService.showFeedback('Errore durante la rimozione dello studente', false)
        });
    }
  }
}
