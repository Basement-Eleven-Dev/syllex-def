import { Component, computed, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBallotCheck, faFlask } from '@fortawesome/pro-solid-svg-icons';
import { TestInterface } from '../../../services/tests-service';
import { RouterLink } from '@angular/router';
import { Materia } from '../../../services/materia';

@Component({
  selector: 'app-calendar-test-card',
  imports: [FontAwesomeModule, RouterLink],
  template: `
    <div
      class="p-3 event-card test rounded-syllex mb-3 d-flex flex-column gap-2"
      [routerLink]="readonly() ? null : '/t/tests/' + Test()._id"
      [class.cursor-default]="readonly()"
    >
      <div class="d-flex flex-row align-items-center justify-content-between mb-1">
        <div class="d-flex flex-row align-items-center gap-2">
          <fa-icon [icon]="TestIcon" class="text-danger"></fa-icon>
          <h6 class="mb-0">{{ Test().name }}</h6>
        </div>
        @if (Test().subjectId) {
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-medium px-2 py-1 small">
            {{ materiaService.getSubjectName(Test().subjectId!) }}
          </span>
        }
      </div>
      @if (ClassCount() > 0) {
        <small class="fw-light text-muted">
          {{ ClassCount() }}
          {{ ClassCount() === 1 ? 'classe assegnata' : 'classi assegnate' }}
        </small>
      }
    </div>
  `,
  styles: `
    .event-card.test {
      border-left: 5px solid var(--bs-danger);
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
      &:hover {
        cursor: pointer;
      }
    }
  `,
})
export class CalendarTestCard {
  protected readonly TestIcon = faBallotCheck;
  protected readonly materiaService = inject(Materia);

  Test = input.required<TestInterface>();
  readonly = input(false);
  ClassCount = computed(() => this.Test().classIds?.length ?? 0);
}
