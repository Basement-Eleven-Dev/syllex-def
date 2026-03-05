import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsService } from '../../../services/students-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faLightbulb,
  faMagic,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-student-ai-summary',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="card border-0 shadow-sm rounded-4 bg-primary bg-opacity-10">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0 text-primary">
            <fa-icon [icon]="icons.faLightbulb" class="me-2"></fa-icon>
            AI Performance Insight
          </h5>
          <button
            (click)="generateInsight()"
            class="btn btn-sm btn-outline-primary rounded-pill px-3"
            [disabled]="loading()"
          >
            <fa-icon
              [icon]="icons.faSyncAlt"
              [animation]="loading() ? 'spin' : undefined"
              class="me-1"
            ></fa-icon>
            {{ insight() ? 'Aggiorna' : 'Genera' }}
          </button>
        </div>

        @if (loading()) {
          <div class="py-4 text-center">
            <div
              class="spinner-grow text-primary spinner-grow-sm me-2"
              role="status"
            ></div>
            <span class="text-muted">L'IA sta analizzando i test...</span>
          </div>
        } @else if (insight()) {
          <div
            class="ai-content p-3 rounded-3 bg-white shadow-sm border-start border-4 border-primary"
          >
            <p
              class="mb-0 text-dark"
              style="line-height: 1.6; font-style: italic;"
            >
              "{{ insight() }}"
            </p>
          </div>
        } @else {
          <div class="py-4 text-center text-muted">
            <p class="mb-0">
              Clicca per generare un'analisi assistita dall'IA sul progresso
              dello studente.
            </p>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './student-ai-summary.scss',
})
export class StudentAiSummaryComponent implements OnInit {
  @Input() studentId!: string;
  @Input() subjectId?: string;
  private studentsService = inject(StudentsService);

  insight = signal<string | null>(null);
  loading = signal<boolean>(false);

  icons = {
    faLightbulb,
    faMagic,
    faSyncAlt,
  };

  ngOnInit() {}

  generateInsight() {
    this.loading.set(true);
    this.studentsService
      .getStudentInsight(this.studentId, this.subjectId)
      .subscribe({
        next: (res) => {
          this.insight.set(res.insight);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
