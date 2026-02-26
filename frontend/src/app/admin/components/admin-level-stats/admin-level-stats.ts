import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService, AdminStats } from '../../service/stats-service';
import { Auth } from '../../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faSchool, 
  faFileLines,
  faChartBar,
  faCalendarCheck,
  faClipboardCheck,
  faUserTie,
  faGraduationCap,
  faUserCheck,
  faChartPie,
  faPlusCircle,
  faTriangleExclamation,
  faArrowTrendUp
} from '@fortawesome/free-solid-svg-icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-admin-level-stats',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, BaseChartDirective],
  templateUrl: './admin-level-stats.html',
  styleUrl: './admin-level-stats.scss',
})
export class AdminLevelStats implements OnInit {
  private statsService = inject(StatsService);
  private authService = inject(Auth);

  public stats?: AdminStats;
  public loading = true;

  // Icons
  icons = {
    faUserGraduate,
    faChalkboardTeacher,
    faSchool,
    faFileLines,
    faChartBar,
    faCalendarCheck,
    faClipboardCheck,
    faUserTie,
    faGraduationCap,
    faUserCheck,
    faChartPie,
    faPlusCircle,
    faTriangleExclamation,
    faArrowTrendUp
  };

  // Chart Configuration
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Test: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: '#3931ce',
      borderRadius: 6
    }]
  };

  // Grades Chart
  public gradesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Media: ${context.parsed.x}%`
        }
      }
    },
    scales: {
      x: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } },
      y: { grid: { display: false } }
    }
  };

  public gradesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      borderRadius: 6
    }]
  };

  ngOnInit() {
    this.loadStats();
  }

  private loadStats() {
    const orgId = this.authService.user?.organizationId || this.authService.user?.organizationIds?.[0];
    if (orgId) {
      this.statsService.getOrganizationStats(orgId.toString()).subscribe({
        next: (data) => {
          this.stats = data;
          this.prepareChart();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading stats:', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  // Curated color palette for subjects
  private subjectColors = [
    '#3931ce', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#3498db', '#e91e63', '#00bcd4',
    '#8bc34a', '#ff5722', '#607d8b', '#795548', '#cddc39'
  ];

  private prepareChart() {
    if (this.stats?.teachingActivity.testsBySubject) {
      const data = this.stats.teachingActivity.testsBySubject;
      this.barChartData = {
        labels: data.map(item => item.subject),
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: data.map((_, i) => this.subjectColors[i % this.subjectColors.length]),
          borderRadius: 6,
          label: 'Test per Materia'
        }]
      };
    }

    if (this.stats?.teachingActivity.avgGradesBySubject) {
      const grades = this.stats.teachingActivity.avgGradesBySubject;
      this.gradesChartData = {
        labels: grades.map(g => g.subject),
        datasets: [{
          data: grades.map(g => g.avgScore),
          backgroundColor: grades.map(g => this.getScoreColor(g.avgScore)),
          borderRadius: 6,
          label: 'Media Voti'
        }]
      };
    }
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  }
}

