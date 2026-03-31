import {
  DatePipe,
  AsyncPipe,
  TitleCasePipe,
  UpperCasePipe,
} from '@angular/common';
import { Component, OnDestroy, OnInit, inject, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faSignOutAlt,
  faUserCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
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
    TourAnchorNgBootstrapDirective,
    AsyncPipe,
    UpperCasePipe,
  ],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  LogoutIcon = faSignOutAlt;
  CalendarIcon = faCalendar;
  now: number = Date.now();
  UserProfileIcon = faUserCircle;
  user: Observable<User | null>;

  constructor(
    public authService: Auth,
    private modalService: NgbModal,
    private router: Router,
  ) {
    this.user = this.authService.user$;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeDropdown();
      }
    });
  }

  getInitals() {
    return this.authService.user$.pipe(
      map((user) => {
        if (!user || !user.firstName || !user.lastName) {
          return '';
        }
        return user.firstName.charAt(0) + user.lastName.charAt(0);
      }),
    );
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

  @ViewChild(NgbDropdown) profileDropdown!: NgbDropdown;

  closeDropdown() {
    if (this.profileDropdown) {
      this.profileDropdown.close();
    }
  }
}
