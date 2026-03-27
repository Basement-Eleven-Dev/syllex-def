import { Component, inject, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faRightFromBracket, faKey, faShieldKeyhole, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective, TourService } from 'ngx-ui-tour-ng-bootstrap';
import { Auth } from '../../../../services/auth';
import { NgbDropdown, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { EditPassword } from '../../../edit-password/edit-password';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, NgbDropdownModule, CommonModule, TourAnchorNgBootstrapDirective],
  templateUrl: './admin-navbar.html',
  styleUrls: ['./admin-navbar.scss'],
})
export class AdminNavbar {
  private authService = inject(Auth);
  private modalService = inject(NgbModal);
  private tourService = inject(TourService);
  @ViewChild(NgbDropdown) mainDropdown!: NgbDropdown;
  
  faUser = faUser;
  faLogout = faRightFromBracket;
  faKey = faKey;
  faLock = faShieldKeyhole;
  faInfoCircle = faInfoCircle;

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

  onStartTour() {
    if (this.mainDropdown) {
      this.mainDropdown.close();
    }
    setTimeout(() => {
      this.tourService.start();
    }, 100);
  }
}
