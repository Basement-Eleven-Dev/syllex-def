import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faRightFromBracket, faKey, faShieldKeyhole } from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../../services/auth';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { EditPassword } from '../../../edit-password/edit-password';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, NgbDropdownModule, CommonModule],
  templateUrl: './admin-navbar.html',
  styleUrls: ['./admin-navbar.scss'],
})
export class AdminNavbar {
  private authService = inject(Auth);
  private modalService = inject(NgbModal);
  
  faUser = faUser;
  faLogout = faRightFromBracket;
  faKey = faKey;
  faLock = faShieldKeyhole;

  user$ = this.authService.user$;

  onChangePassword() {
    this.modalService.open(EditPassword, {
        centered: true,
        size: 'md'
    });
  }

  onLogout() {
    this.authService.logout();
  }
}
