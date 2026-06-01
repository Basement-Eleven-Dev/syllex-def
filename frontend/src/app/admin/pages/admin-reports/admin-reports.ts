import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBug, faEye, faTimes, faCheck, faClock, faCircle, faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportsService, ReportInterface } from '../../../../services/reports-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.scss',
})
export class AdminReports implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly feedbackService = inject(FeedbackService);

  readonly BugIcon = faBug;
  readonly EyeIcon = faEye;
  readonly TimesIcon = faTimes;
  readonly CheckIcon = faCheck;
  readonly ClockIcon = faClock;
  readonly CircleIcon = faCircle;
  readonly SpinnerIcon = faSpinnerThird;

  private readonly modalService = inject(NgbModal);

  reports = signal<ReportInterface[]>([]);
  selectedReport = signal<ReportInterface | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    this.isLoading.set(true);
    this.reportsService.getReports().subscribe({
      next: (res) => {
        if (res.success) {
          this.reports.set(res.reports);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading reports', err);
        this.isLoading.set(false);
        this.feedbackService.showFeedback('Errore nel caricamento dei report', false);
      }
    });
  }

  updateStatus(report: ReportInterface, event: any) {
    const newStatus = event.target.value;
    if (!report._id) return;

    this.reportsService.updateReportStatus(report._id, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedbackService.showFeedback('Stato aggiornato', true);
          // Aggiorna lo stato localmente
          this.reports.update(reports => 
            reports.map(r => r._id === report._id ? { ...r, status: newStatus as any } : r)
          );
        }
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.feedbackService.showFeedback('Errore aggiornamento', false);
        // Resetta la select ricaricando
        this.loadReports();
      }
    });
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'open': return 'badge bg-danger text-white';
      case 'in-progress': return 'badge bg-warning text-dark';
      case 'resolved': return 'badge bg-success text-white';
      case 'closed': return 'badge bg-dark text-white';
      default: return 'badge bg-dark text-white';
    }
  }

  getStatusIcon(status: string | undefined) {
    switch (status) {
      case 'open': return this.CircleIcon;
      case 'in-progress': return this.ClockIcon;
      case 'resolved': return this.CheckIcon;
      case 'closed': return this.CheckIcon;
      default: return this.CircleIcon;
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/D';
    return new Date(dateString).toLocaleString('it-IT');
  }

  openReportModal(content: any, report: ReportInterface) {
    this.selectedReport.set(report);
    this.modalService.open(content, { centered: true, size: 'lg' });
  }
}
