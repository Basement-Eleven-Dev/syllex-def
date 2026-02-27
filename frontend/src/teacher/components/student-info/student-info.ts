import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faUserCircle, faGraduationCap, faCheckCircle, faFileAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-student-info',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4 text-center">
        <div class="mb-3">
            <fa-icon [icon]="icons.faUserCircle" class="text-primary opacity-25" style="font-size: 100px;"></fa-icon>
        </div>
        <h4 class="fw-bold mb-1 text-dark">{{ student.firstName }} {{ student.lastName }}</h4>
        <p class="text-muted small mb-4">
          <fa-icon [icon]="icons.faEnvelope" class="me-1"></fa-icon>
          {{ student.email || student.username }}
        </p>

        <div class="stats-grid">
          <!-- Avg Score -->
          <div class="stat-tile rounded-4 p-3">
            <div class="d-flex flex-column align-items-center">
              <div class="stat-icon-bg mb-2">
                <fa-icon [icon]="icons.faGraduationCap" class="text-primary"></fa-icon>
              </div>
              <div class="fw-bold fs-3 text-dark">{{ stats.avgScore }}%</div>
              <div class="text-muted x-small-text text-uppercase fw-semibold">Media Voti</div>
            </div>
          </div>
          <!-- Completed Tests -->
          <div class="stat-tile rounded-4 p-3">
            <div class="d-flex flex-column align-items-center">
              <div class="stat-icon-bg mb-2 success-bg">
                <fa-icon [icon]="icons.faCheckCircle" class="text-dark-green"></fa-icon>
              </div>
              <div class="fw-bold fs-3 text-dark">{{ stats.completedTests }}</div>
              <div class="text-muted x-small-text text-uppercase fw-semibold">Test Fatti</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './student-info.scss'
})
export class StudentInfoComponent {
  @Input() student: any;
  @Input() stats: any;

  icons = {
    faEnvelope,
    faUserCircle,
    faGraduationCap,
    faCheckCircle,
    faFileAlt
  };
}
