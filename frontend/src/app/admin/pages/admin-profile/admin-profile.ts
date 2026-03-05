import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faEnvelope, faLock, faBuilding, faShieldKeyhole } from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditEmail } from '../../../edit-email/edit-email';
import { EditPassword } from '../../../edit-password/edit-password';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.scss',
})
export class AdminProfile {
  public authService = inject(Auth);
  private modalService = inject(NgbModal);

  // Icons
  faUser = faUser;
  faEnvelope = faEnvelope;
  faLock = faLock;
  faBuilding = faBuilding;
  faShield = faShieldKeyhole;

  onChangeEmail(): void {
    this.modalService.open(EditEmail, {
      centered: true,
      size: 'md',
    });
  }

  onChangePassword(): void {
    this.modalService.open(EditPassword, {
      centered: true,
      size: 'md',
    });
  }
}
