import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../services/auth';
import { StatsService, AdminStats } from '../../service/stats-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartLine, 
  faBuilding, 
  faUsers, 
  faCheckCircle, 
  faExclamationTriangle, 
  faWandMagicSparkles,
  faChartPie,
  faPlusCircle,
  faUserCheck,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['../../pages/admin-dashboard/admin-dashboard.scss'] // Reusing original styles
})
export class DashboardAdmin implements OnInit {
  public auth = inject(Auth);
  private statsService = inject(StatsService);

  public adminStats?: AdminStats;
  public loading = true;

  icons = {
    faChartLine,
    faBuilding,
    faUsers,
    faCheckCircle,
    faExclamationTriangle,
    faWandMagicSparkles,
    faChartPie,
    faPlusCircle,
    faUserCheck,
    faBook
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const orgId = this.auth.user?.organizationId || this.auth.user?.organizationIds?.[0];
    if (orgId) {
      this.statsService.getOrganizationStats(orgId.toString()).subscribe({
        next: (res) => {
          this.adminStats = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  get studentEngagement(): number {
    if (!this.adminStats?.kpis.totalStudents) return 0;
    return Math.round((this.adminStats.kpis.activeStudents / this.adminStats.kpis.totalStudents) * 100);
  }

  get contentPulse(): number {
    return this.adminStats?.kpis.publishedTests || 0;
  }

  get inactiveClassesCount(): number {
    return this.adminStats?.kpis.inactiveClassesCount || 0;
  }
}
