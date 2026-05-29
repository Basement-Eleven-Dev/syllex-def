import { Component, inject, EventEmitter, Output } from '@angular/core';
import { faSignOutAlt } from '@fortawesome/pro-regular-svg-icons';
import { Auth } from '../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Calendario } from '../../../teacher/components/calendario/calendario';
import { RouterModule } from '@angular/router';
import { ReportBugForm } from '../../../teacher/components/report-bug-form/report-bug-form';

@Component({
  selector: 'app-student-user-contextual-menu',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './student-user-contextual-menu.html',
  styleUrl: './student-user-contextual-menu.scss',
})
export class StudentUserContextualMenu {
  @Output() menuClicked = new EventEmitter<void>();

  LogoutIcon = faSignOutAlt;

  constructor(
    public authService: Auth,
    private modalService: NgbModal,
  ) {}

  onItemClick() {
    this.menuClicked.emit();
  }

  onLogout() {
    this.authService.logout();
  }

  onOpenCalendar() {
    const modalRef = this.modalService.open(Calendario, {
      size: 'xl',
      centered: true,
    });
    modalRef.componentInstance.showCloseButton = true;
  }

  onReportBug() {
    this.modalService.open(ReportBugForm, {
      size: 'md',
      centered: true,
    });
  }
}
