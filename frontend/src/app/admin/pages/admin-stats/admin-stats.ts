import { Component, inject } from '@angular/core';
import { AdminLevelStats } from "../../components/admin-level-stats/admin-level-stats";
import { SuperadminLevelStats } from "../../components/superadmin-level-stats/superadmin-level-stats";
import { Auth } from "../../../../services/auth";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [AdminLevelStats, SuperadminLevelStats, CommonModule],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.scss',
})
export class AdminStats {
  public authService = inject(Auth);
}
