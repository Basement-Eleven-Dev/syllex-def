import { CommonModule } from '@angular/common';
import { StatsService, SuperAdminStats } from '../../service/stats-service';
import { Component, inject, OnInit } from '@angular/core';
import { Auth } from '../../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faBuilding, 
  faUsers, 
  faDatabase, 
  faMicrochip,
  faChartLine,
  faArrowRight,
  faBook,
  faChalkboardTeacher,
  faWeightHanging,
  faFileCode,
  faFileDownload,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-superadmin-level-stats',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, BaseChartDirective],
  templateUrl: './superadmin-level-stats.html',
  styleUrl: './superadmin-level-stats.scss',
})
export class SuperadminLevelStats implements OnInit {
  private statsService = inject(StatsService);
  public authService = inject(Auth);

  public stats?: SuperAdminStats;
  public loading = true;

  // Icons
  icons = {
    faBuilding,
    faUsers,
    faDatabase,
    faMicrochip,
    faChartLine,
    faArrowRight,
    faBook,
    faChalkboardTeacher,
    faWeightHanging,
    faFileCode,
    faFileDownload,
    faSignOutAlt,
  };

  // Top Organizations Chart
  public orgChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Tokens: ${context.parsed.y?.toLocaleString() || 0}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    }
  };

  public orgChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: '#3931ce',
      borderRadius: 6,
      label: 'Token per Organizzazione'
    }]
  };

  // Heavy Subjects Chart
  public subjectsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Tokens: ${context.parsed.x?.toLocaleString() || 0}`
        }
      }
    },
    scales: {
      x: { beginAtZero: true },
      y: { grid: { display: false } }
    }
  };

  public subjectsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: '#e74c3c',
      borderRadius: 6,
      label: 'Token per Materia'
    }]
  };

  ngOnInit() {
    this.loadStats();
  }

  private loadStats() {
    this.statsService.getSuperAdminStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.prepareCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading superadmin stats:', err);
        this.loading = false;
      }
    });
  }

  private prepareCharts() {
    if (this.stats?.organizations) {
      const topOrgs = this.stats.organizations.slice(0, 8);
      this.orgChartData = {
        labels: topOrgs.map(o => o.name),
        datasets: [{
          data: topOrgs.map(o => o.estimatedTokens),
          backgroundColor: '#3931ce',
          borderRadius: 6,
          label: 'Token per Organizzazione'
        }]
      };
    }

    if (this.stats?.technicalAnalysis.heavySubjects) {
      const topSubjects = this.stats.technicalAnalysis.heavySubjects.slice(0, 8);
      this.subjectsChartData = {
        labels: topSubjects.map(s => s.name),
        datasets: [{
          data: topSubjects.map(s => s.estimatedTokens),
          backgroundColor: '#e74c3c',
          borderRadius: 6,
          label: 'Token per Materia'
        }]
      };
    }
  }

  get chunkHealth(): number {
    if (!this.stats?.technicalAnalysis.metrics.avgChunkSize) return 0;
    // Targeting 1500 chars per chunk as per backend logic
    const health = (this.stats.technicalAnalysis.metrics.avgChunkSize / 1500) * 100;
    return Math.min(Math.round(health), 100);
  }

  get healthStatus(): string {
    const health = this.chunkHealth;
    if (health > 80) return 'Ottimale';
    if (health > 50) return 'Buono';
    return 'Da ottimizzare';
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'k';
    return tokens.toString();
  }

  downloadReport() {
    if (!this.stats?.organizations) return;

    const headers = ['ID', 'Nome', 'Utenti', 'Documenti', 'Chunks', 'Tokens', 'Stato Onboarding'];
    const rows = this.stats.organizations.map(org => [
      org.organizationId,
      org.name,
      org.userCount,
      org.documentCount,
      org.chunkCount,
      org.estimatedTokens,
      org.onboardingStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'report_organizzazioni.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loginAsAdmin(orgId: string) {
    this.authService.impersonate(orgId);
  }

  stopImpersonation() {
    this.authService.stopImpersonating();
  }
}
