import { Component, EventEmitter, inject, Output } from '@angular/core';
import { faSignOutAlt } from '@fortawesome/pro-regular-svg-icons';
import { TourService } from 'ngx-ui-tour-ng-bootstrap';
import { Auth } from '../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Calendario } from '../calendario/calendario';
import { RouterModule } from '@angular/router';
import { ReportBugForm } from '../report-bug-form/report-bug-form';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-user-contextual-menu',
  imports: [FontAwesomeModule, RouterModule, TranslocoDirective, TranslocoPipe],
  templateUrl: './user-contextual-menu.html',
  styleUrl: './user-contextual-menu.scss',
})
export class UserContextualMenu {
  @Output() menuClicked = new EventEmitter<void>();

  LogoutIcon = faSignOutAlt;
  private tourService = inject(TourService);
  protected readonly translocoService = inject(TranslocoService);

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
