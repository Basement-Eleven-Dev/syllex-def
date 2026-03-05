import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
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
  faChevronRight,
  faEdit,
  faTrash,
  faCopy,
  faExclamationCircle
} from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';
import { Auth } from '../../../../services/auth';

import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UserModal } from '../../components/user-modal/user-modal';
import { ClassModal } from '../../components/class-modal/class-modal';
import { SubjectModal } from '../../components/subject-modal/subject-modal';
import { BulkImportModal } from '../../components/bulk-import-modal/bulk-import-modal';
import { AdminAnalyticsComponent } from '../../components/admin-analytics/admin-analytics';

import { AssignmentModal } from '../../components/assignment-modal/assignment-modal';

type TabType = 'overview' | 'staff' | 'didactics' | 'students';

@Component({
  selector: 'app-admin-organization-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, NgbDropdownModule, AdminAnalyticsComponent],
  templateUrl: './admin-organization-detail.html',
  styleUrl: './admin-organization-detail.scss',
})
export class AdminOrganizationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);
  public auth = inject(Auth);
  private modalService = inject(NgbModal);

  private router = inject(Router);

  orgId: string | null = null;
  organization: any = null;
  stats: any = null;
  loading = true;
  didacticsLoading = false;
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
    faChevronRight,
    faEdit,
    faTrash,
    faCopy,
    faExclamationCircle
  };

  ngOnInit() {
    this.orgId = this.route.snapshot.paramMap.get('id');
    if (this.orgId) {
      this.loadWorkspaceDetails();
      this.loadDidactics().subscribe();
    }
  }

  setActiveTab(tab: TabType) {
    this.activeTab = tab;
    if (tab === 'staff' && this.staffList.length === 0) this.loadStaff();
    if (tab === 'didactics' && !this.didactics) this.loadDidactics().subscribe();
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
    this.didacticsLoading = true;
    return this.onboardingService.getWorkspaceDidactics(this.orgId!).pipe(
      tap(res => {
        this.didactics = res;
        this.didacticsLoading = false;
      })
    );
  }

  loadStudents() {
    this.onboardingService.getWorkspaceStudents(this.orgId!).subscribe({
      next: (res) => this.studentsList = res.students,
      error: () => this.feedbackService.showFeedback('Errore caricamento studenti', false)
    });
  }

  openAddStaffModal() {
    const openModal = () => {
        const modalRef = this.modalService.open(UserModal, { centered: true });
        modalRef.componentInstance.orgId = this.orgId;
        modalRef.componentInstance.title = 'Aggiungi Personale';
        modalRef.componentInstance.subjects = this.didactics?.subjects || [];
        modalRef.componentInstance.classes = this.didactics?.classes || [];
        modalRef.result.then((newUser) => {
            if (newUser) {
                this.staffList = [newUser, ...this.staffList];
                this.stats.staffCount++;
            }
        }, () => {});
    };

    if (!this.didactics) {
        this.loadDidactics().subscribe({
            next: () => openModal(),
            error: () => this.feedbackService.showFeedback('Impossibile caricare i dati della struttura', false)
        });
    } else {
        openModal();
    }
  }

  openAddStudentModal() {
    const openModal = () => {
        const modalRef = this.modalService.open(UserModal, { centered: true });
        modalRef.componentInstance.orgId = this.orgId;
        modalRef.componentInstance.title = 'Aggiungi Studente';
        modalRef.componentInstance.fixedRole = 'student';
        modalRef.componentInstance.classes = this.didactics?.classes || [];
        modalRef.componentInstance.subjects = this.didactics?.subjects || [];
        modalRef.result.then((newUser) => {
            if (newUser) {
                this.studentsList = [newUser, ...this.studentsList];
                this.stats.studentsCount++;
            }
        }, () => {});
    };

    if (!this.didactics) {
        this.loadDidactics().subscribe({
            next: () => openModal(),
            error: () => this.feedbackService.showFeedback('Impossibile caricare i dati della struttura', false)
        });
    } else {
        openModal();
    }
  }

  openAddClassModal() {
    const modalRef = this.modalService.open(ClassModal, { centered: true });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.result.then((res) => {
        if (res) {
            this.loadDidactics();
            this.stats.classesCount++;
        }
    }, () => {});
  }

  openAddSubjectModal() {
    if (!this.staffList || this.staffList.length === 0) {
        this.loadStaff();
    }
    const modalRef = this.modalService.open(SubjectModal, { centered: true });
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.teachers = this.staffList.filter(u => u.role === 'teacher');
    modalRef.result.then((res) => {
        if (res) {
            this.loadDidactics().subscribe();
            this.stats.subjectsCount++;
        }
    }, () => {});
  }

  openAssignmentModal(preData?: { teacherId?: string, classId?: string }) {
    const modalRef = this.modalService.open(AssignmentModal, { centered: true });
    modalRef.componentInstance.orgId = this.orgId;
    if (preData?.teacherId) modalRef.componentInstance.fixedTeacherId = preData.teacherId;
    if (preData?.classId) modalRef.componentInstance.classId = preData.classId;
    
    modalRef.result.then((res) => {
        if (res) {
            this.loadDidactics().subscribe();
            if (preData?.teacherId) {
                // Refresh staff to update "Without Class" status
                this.loadStaff();
            }
        }
    }, () => {});
  }

  openAssignmentFromStaff(user: any) {
    this.openAssignmentModal({ teacherId: user._id });
  }

  openEditUserModal(user: any, listType: 'staff' | 'student') {
    const openModal = () => {
        const modalRef = this.modalService.open(UserModal, { centered: true });
        modalRef.componentInstance.orgId = this.orgId;
        modalRef.componentInstance.user = user;
        modalRef.componentInstance.subjects = this.didactics?.subjects || [];
        modalRef.componentInstance.classes = this.didactics?.classes || [];
        modalRef.result.then((updatedUser) => {
            if (updatedUser) {
                if (listType === 'staff') {
                    this.staffList = this.staffList.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u);
                } else {
                    this.studentsList = this.studentsList.map(u => u._id === updatedUser._id ? { ...u, ...updatedUser } : u);
                }
            }
        }, () => {});
    };

    if (!this.didactics) {
        this.loadDidactics().subscribe({
            next: () => openModal(),
            error: () => this.feedbackService.showFeedback('Impossibile caricare i dati della struttura', false)
        });
    } else {
        openModal();
    }
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

  goToClassDetail(classId: string) {
    this.router.navigate(['/a/organizzazioni', this.orgId, 'classi', classId]);
  }

  removeUser(userId: string, role: 'staff' | 'student') {
    if (confirm('Sei sicuro di voler rimuovere questo utente dall\'organizzazione?')) {
        this.onboardingService.removeUser(this.orgId!, userId).subscribe({
            next: () => {
                this.feedbackService.showFeedback('Utente rimosso con successo', true);
                if (role === 'staff') {
                    this.staffList = this.staffList.filter(u => u._id !== userId);
                    this.stats.staffCount--;
                } else {
                    this.studentsList = this.studentsList.filter(u => u._id !== userId);
                    this.stats.studentsCount--;
                }
            },
            error: () => this.feedbackService.showFeedback('Errore durante la rimozione dell\'utente', false)
        });
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.feedbackService.showFeedback('ID copiato negli appunti', true);
    });
  }
}
