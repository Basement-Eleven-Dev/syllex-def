import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AdminLevelStats } from "../../components/admin-level-stats/admin-level-stats";
import { SuperadminLevelStats } from "../../components/superadmin-level-stats/superadmin-level-stats";
import { Auth } from "../../../../services/auth";

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [AdminLevelStats, SuperadminLevelStats, CommonModule, FontAwesomeModule],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.scss',
})
export class AdminStats {
  public authService = inject(Auth);

  icons = {
    faSignOutAlt
  };

  stopImpersonation() {
    this.authService.stopImpersonating();
  }
}
