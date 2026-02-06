import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt, faUserCircle } from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../services/auth';

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
    NgbDropdownItem,
  ],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav implements OnInit, OnDestroy {
  LogoutIcon = faSignOutAlt;
  now: number = Date.now();
  private intervalId?: number;
  UserProfileIcon = faUserCircle;

  constructor(public authService: Auth) {}

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
}
