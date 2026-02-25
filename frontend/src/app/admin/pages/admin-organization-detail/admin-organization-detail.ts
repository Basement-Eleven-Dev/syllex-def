import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faLandmark, 
  faUserTie, 
  faUsers, 
  faBook, 
  faArrowLeft,
  faPlus,
  faEnvelope,
  faEllipsisV,
  faLink,
  faGraduationCap,
  faChevronRight
} from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserModal } from '../../components/user-modal/user-modal';
import { BulkImportModal } from '../../components/bulk-import-modal/bulk-import-modal';

type TabType = 'overview' | 'staff' | 'didactics' | 'students';

@Component({
  selector: 'app-admin-organization-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './admin-organization-detail.html',
  styleUrl: './admin-organization-detail.scss',
})
export class AdminOrganizationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);
  private modalService = inject(NgbModal);

  orgId: string | null = null;
  organization: any = null;
  stats: any = null;
  loading = true;
  activeTab: TabType = 'overview';

  // Data for tabs
  staffList: any[] = [];
  didactics: any = null;
  studentsList: any[] = [];
  
  icons = {
    faLandmark,
    faUserTie,
    faUsers,
    faBook,
    faArrowLeft,
    faPlus,
    faEnvelope,
    faEllipsisV,
    faLink,
    faGraduationCap,
    faChevronRight
  };

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('id');
    if (this.orgId) {
      this.loadWorkspaceDetails();
    }
  }

  setActiveTab(tab: TabType) {
    this.activeTab = tab;
    if (tab === 'staff' && this.staffList.length === 0) this.loadStaff();
    if (tab === 'didactics' && !this.didactics) this.loadDidactics();
    if (tab === 'students' && this.studentsList.length === 0) this.loadStudents();
  }

  loadWorkspaceDetails() {
    this.loading = true;
    this.onboardingService.getWorkspaceDetails(this.orgId!).subscribe({
      next: (res) => {
        this.organization = res.organization;
        this.stats = res.stats;
        this.loading = false;
      },
      error: (err) => {
        this.feedbackService.showFeedback('Errore nel caricamento del workspace', false);
        this.loading = false;
      }
    });
  }

  loadStaff() {
    this.onboardingService.getWorkspaceStaff(this.orgId!).subscribe({
      next: (res) => this.staffList = res.staff,
      error: () => this.feedbackService.showFeedback('Errore caricamento staff', false)
    });
  }

  loadDidactics() {
    this.onboardingService.getWorkspaceDidactics(this.orgId!).subscribe({
      next: (res) => this.didactics = res,
      error: () => this.feedbackService.showFeedback('Errore caricamento didattica', false)
    });
  }

  loadStudents() {
    this.onboardingService.getWorkspaceStudents(this.orgId!).subscribe({
      next: (res) => this.studentsList = res.students,
      error: () => this.feedbackService.showFeedback('Errore caricamento studenti', false)
    });
  }

  openAddStaffModal() {
    const modalRef = this.modalService.open(UserModal, { centered: true });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.title = 'Aggiungi Personale';
    modalRef.result.then((newUser) => {
        if (newUser) {
            this.staffList = [newUser, ...this.staffList];
            this.stats.staffCount++;
        }
    }, () => {});
  }

  openAddStudentModal() {
    const modalRef = this.modalService.open(UserModal, { centered: true });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.title = 'Aggiungi Studente';
    modalRef.componentInstance.fixedRole = 'student';
    modalRef.result.then((newUser) => {
        if (newUser) {
            this.studentsList = [newUser, ...this.studentsList];
            this.stats.studentsCount++;
        }
    }, () => {});
  }

  openBulkImportModal(classId?: string) {
    if (!this.didactics && this.activeTab !== 'didactics') {
        this.loadDidactics();
    }
    
    const modalRef = this.modalService.open(BulkImportModal, { centered: true, size: 'lg' });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.classes = this.didactics?.classes || [];
    modalRef.componentInstance.targetClassId = classId;
    modalRef.result.then((success) => {
        if (success) {
            this.loadStudents();
            this.loadWorkspaceDetails(); // Refresh stats
            if (this.activeTab === 'didactics') this.loadDidactics();
        }
    }, () => {});
  }
}
