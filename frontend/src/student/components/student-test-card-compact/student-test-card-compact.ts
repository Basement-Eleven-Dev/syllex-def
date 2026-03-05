import { Component, computed, input } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faEye,
  faPlay,
  faQuestionCircle,
  faRotateRight,
  faStar,
  faArrowRight,
} from '@fortawesome/pro-solid-svg-icons';
import { StudentTestInterface } from '../../../services/student-tests.service';

type AttemptStatus = 'in-progress' | 'delivered' | 'reviewed';

@Component({
  selector: 'app-student-test-card-compact',
  standalone: true,
  imports: [CommonModule, DatePipe, FontAwesomeModule, RouterModule],
  templateUrl: './student-test-card-compact.html',
  styleUrl: './student-test-card-compact.scss',
})
export class StudentTestCardCompact {
  readonly Test = input.required<StudentTestInterface>();
  readonly AttemptStatus = input<AttemptStatus | null>(null);

  readonly ClockIcon = faClock;
  readonly QuestionsIcon = faQuestionCircle;
  readonly PlayIcon = faPlay;
  readonly ResumeIcon = faRotateRight;
  readonly ReviewIcon = faEye;
  readonly ArrowIcon = faArrowRight;

  readonly QuestionsCount = computed(() => this.Test().questions?.length ?? 0);

  readonly MaxScore = computed(() =>
    (this.Test().questions ?? []).reduce((total, q) => total + q.points, 0),
  );

  readonly IsCompleted = computed(() => {
    const status = this.AttemptStatus();
    return status === 'delivered' || status === 'reviewed';
  });

  readonly StatusBadge = computed(() => {
    const status = this.AttemptStatus();
    if (status === 'reviewed') return 'Rivisto';
    if (status === 'delivered') return 'Completato';
    if (status === 'in-progress') return 'In corso';
    return 'Non iniziato';
  });

  readonly StatusClass = computed(() => {
    const status = this.AttemptStatus();
    if (status === 'reviewed') return 'status--reviewed';
    if (status === 'delivered') return 'status--completed';
    if (status === 'in-progress') return 'status--in-progress';
    return 'status--pending';
  });

  readonly Route = computed(() => {
    const test = this.Test();
    if (this.IsCompleted()) {
      return ['/s/tests/review/', test._id];
    }
    return ['/s/tests/execute/', test._id];
  });
}
