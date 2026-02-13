import { Component } from '@angular/core';
import { faSignOutAlt } from '@fortawesome/pro-regular-svg-icons';
import { Auth } from '../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Calendario } from '../calendario/calendario';
import { RouterModule } from '@angular/router';
import { ReportBugForm } from '../report-bug-form/report-bug-form';

@Component({
  selector: 'app-user-contextual-menu',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './user-contextual-menu.html',
  styleUrl: './user-contextual-menu.scss',
})
export class UserContextualMenu {
  LogoutIcon = faSignOutAlt;

  constructor(
    public authService: Auth,
    private modalService: NgbModal,
  ) {}

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
