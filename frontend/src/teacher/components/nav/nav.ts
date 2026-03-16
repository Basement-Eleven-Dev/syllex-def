import { AsyncPipe, DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faSignOutAlt,
  faUserCircle,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { Auth, User } from '../../../services/auth';
import { Calendario } from '../calendario/calendario';
import { UserContextualMenu } from '../user-contextual-menu/user-contextual-menu';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-nav',
  imports: [
    DatePipe,
    TitleCasePipe,
    RouterModule,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    UserContextualMenu,
    AsyncPipe,
    UpperCasePipe
  ],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav implements OnInit, OnDestroy {
  LogoutIcon = faSignOutAlt;
  CalendarIcon = faCalendar;
  now: number = Date.now();
  private intervalId?: number;
  UserProfileIcon = faUserCircle;
  user: Observable<User | null>;

  constructor(
    public authService: Auth,
    private modalService: NgbModal,
  ) {
    this.user = this.authService.user$;
  }

  getInitals() {
    return this.authService.user$.pipe(
      map((user) => {
        if (!user || !user.firstName || !user.lastName) {
          return '';
        }
        return user.firstName.charAt(0) + user.lastName.charAt(0);
      })
    );
  }
  ngOnInit() {
    this.intervalId = window.setInterval(() => {
      this.now = Date.now();
    }, 60000); // Update every minute
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onLogout() {
    this.authService.logout().then(() => {
      window.location.reload();
    });
  }

  openCalendarioModal() {
    const modalRef = this.modalService.open(Calendario, {
      size: 'xl',
      centered: true,
    });
    modalRef.componentInstance.showCloseButton = true;
  }
}
