import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faRightFromBracket } from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../../services/auth';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './admin-navbar.html',
  styleUrls: ['./admin-navbar.scss'],
})
export class AdminNavbar {
  faUser = faUser;
  faLogout = faRightFromBracket;
  constructor(private authService: Auth){}

  onLogout() {
    this.authService.logout();
  }
}
