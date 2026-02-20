import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { Materia, TopicObject } from '../../../services/materia';
import { StudentTestsService } from '../../../services/student-tests.service';

type QuestionType = 'scelta multipla' | 'vero falso' | 'risposta aperta';

@Component({
  selector: 'app-student-create-test',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './student-create-test.html',
  styleUrl: './student-create-test.scss',
})
export class StudentCreateTest {
  private readonly materiaService = inject(Materia);
  private readonly testsService = inject(StudentTestsService);
  private readonly router = inject(Router);

  readonly BackIcon = faArrowLeft;
  readonly CheckIcon = faCheck;
  readonly RemoveIcon = faXmark;

  readonly AllSubjects = this.materiaService.allMaterie;
  readonly AllQuestionTypes: QuestionType[] = [
    'scelta multipla',
    'vero falso',
    'risposta aperta',
  ];

  readonly SelectedSubjectId = signal<string>('');
  readonly SelectedTopicIds = signal<Set<string>>(new Set());
  readonly QuestionCount = signal<number>(10);
  readonly ExcludedTypes = signal<Set<QuestionType>>(new Set());
  readonly TimeLimitEnabled = signal<boolean>(false);
  readonly TimeLimit = signal<number>(30);
  readonly IsSubmitting = signal<boolean>(false);

  readonly SelectedSubject = computed(
    () =>
      this.AllSubjects().find((s) => s._id === this.SelectedSubjectId()) ??
      null,
  );

  readonly AvailableTopics = computed<TopicObject[]>(
    () => this.SelectedSubject()?.topics ?? [],
  );

  readonly IsFormValid = computed(
    () =>
      this.SelectedSubjectId().length > 0 &&
      this.SelectedTopicIds().size > 0 &&
      this.QuestionCount() >= 1 &&
      this.QuestionCount() <= 100 &&
      (!this.TimeLimitEnabled() || this.TimeLimit() >= 1),
  );

  onSubjectChange(subjectId: string): void {
    this.SelectedSubjectId.set(subjectId);
    this.SelectedTopicIds.set(new Set());
  }

  toggleTopic(topicId: string): void {
    const updated = new Set(this.SelectedTopicIds());
    updated.has(topicId) ? updated.delete(topicId) : updated.add(topicId);
    this.SelectedTopicIds.set(updated);
  }

  isTopicSelected(topicId: string): boolean {
    return this.SelectedTopicIds().has(topicId);
  }

  selectAllTopics(): void {
    this.SelectedTopicIds.set(
      new Set(this.AvailableTopics().map((t) => t._id)),
    );
  }

  clearTopics(): void {
    this.SelectedTopicIds.set(new Set());
  }

  toggleExcludedType(type: QuestionType): void {
    const updated = new Set(this.ExcludedTypes());
    updated.has(type) ? updated.delete(type) : updated.add(type);
    this.ExcludedTypes.set(updated);
  }

  isTypeExcluded(type: QuestionType): boolean {
    return this.ExcludedTypes().has(type);
  }

  setQuestionCount(value: string): void {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) this.QuestionCount.set(parsed);
  }

  setTimeLimit(value: string): void {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) this.TimeLimit.set(parsed);
  }

  onSubmit(): void {
    if (!this.IsFormValid() || this.IsSubmitting()) return;

    this.IsSubmitting.set(true);

    this.testsService
      .createSelfEvaluation({
        subjectId: this.SelectedSubjectId(),
        topicIds: Array.from(this.SelectedTopicIds()),
        questionCount: this.QuestionCount(),
        excludedTypes: Array.from(this.ExcludedTypes()),
        timeLimit: this.TimeLimitEnabled() ? this.TimeLimit() : null,
      })
      .subscribe({
        next: ({ testId }) => {
          this.router.navigate(['/s/tests/execute', testId]);
        },
        error: () => {
          this.IsSubmitting.set(false);
        },
      });
  }
}
