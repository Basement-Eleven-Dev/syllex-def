import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService, SuperAdminStats } from '../../service/stats-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartLine, 
  faBuilding, 
  faUsers, 
  faCheckCircle, 
  faExclamationTriangle, 
  faArrowTrendUp, 
  faClock,
  faWandMagicSparkles,
  faUserCheck,
  faBook,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-super-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './dashboard-super-admin.html',
  styleUrls: ['../../pages/admin-dashboard/admin-dashboard.scss'] // Reusing original styles
})
export class DashboardSuperAdmin implements OnInit {
  private statsService = inject(StatsService);

  public superStats?: SuperAdminStats;
  public loading = true;

  icons = {
    faChartLine,
    faBuilding,
    faUsers,
    faCheckCircle,
    faExclamationTriangle,
    faArrowTrendUp,
    faClock,
    faWandMagicSparkles,
    faUserCheck,
    faBook,
    faArrowUp,
    faArrowDown
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.statsService.getSuperAdminStats().subscribe({
      next: (res) => {
        this.superStats = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get aiSuccessRate(): number { 
    return this.superStats?.technicalAnalysis.metrics.aiHealth.successRate || 0; 
  }

  get aiStatus(): string {
    return this.superStats?.technicalAnalysis.metrics.aiHealth.status || 'Inattivo';
  }

  get recentGenerations(): number {
    return this.superStats?.technicalAnalysis.metrics.aiHealth.recentGenerations || 0;
  }
  
  get usageTrend(): { value: number; isUp: boolean } { 
    return this.superStats?.technicalAnalysis.metrics.usageTrend || { value: 0, isUp: true }; 
  }
  
  get incompleteOnboardingCount(): number {
    return this.superStats?.organizations.filter(o => o.onboardingStatus === 'Pendente' || o.documentCount === 0).length || 0;
  }
}
