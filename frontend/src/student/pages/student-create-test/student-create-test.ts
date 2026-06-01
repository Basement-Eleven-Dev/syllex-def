import { Component, computed, inject, signal, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { Materia, TopicObject } from '../../../services/materia';
import { StudentTestsService } from '../../../services/student-tests.service';
import { SyllexPageHeader } from '../../../teacher/components/UI/syllex-page-header/syllex-page-header';
import { SyllexButton } from '../../../teacher/components/UI/syllex-button/syllex-button';
import { SelectOption, SyllexSelectInput } from '../../../teacher/components/UI/syllex-select-input/syllex-select-input';
import { BackTo } from '../../../teacher/components/back-to/back-to';

type QuestionType = 'scelta multipla' | 'vero falso' | 'risposta aperta';

@Component({
  selector: 'app-student-create-test',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, SyllexPageHeader, SyllexButton, SyllexSelectInput, BackTo],
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
  readonly SubjectOptions = computed<SelectOption[]>(() =>
    this.AllSubjects().map((s) => ({ value: s._id, label: s.name })),
  );
  readonly AllQuestionTypes: QuestionType[] = [
    'scelta multipla',
    'vero falso',
    'risposta aperta',
  ];

  readonly TestName = signal<string>('Auto-valutazione');
  readonly SelectedSubjectId = signal<string>('');
  readonly SelectedTopicIds = signal<Set<string>>(new Set());
  readonly QuestionCount = signal<number>(10);
  readonly ExcludedTypes = signal<Set<QuestionType>>(new Set());
  readonly TimeLimitEnabled = signal<boolean>(false);
  readonly TimeLimit = signal<number>(30);
  readonly IsSubmitting = signal<boolean>(false);
  readonly AvailableQuestionsCount = signal<number | null>(null);

  readonly SelectedSubject = computed(
    () =>
      this.AllSubjects().find((s) => s._id === this.SelectedSubjectId()) ??
      null,
  );

  readonly AvailableTopics = computed<TopicObject[]>(
    () => this.SelectedSubject()?.topics ?? [],
  );

  readonly ShowCountWarning = computed(() => {
    const count = this.QuestionCount();
    const available = this.AvailableQuestionsCount();
    return available !== null && available > 0 && count > available;
  });

  constructor() {
    const filter$ = toObservable(
      computed(() => ({
        subjectId: this.SelectedSubjectId(),
        topicIds: Array.from(this.SelectedTopicIds()),
        excludedTypes: Array.from(this.ExcludedTypes()),
      })),
    );

    filter$
      .pipe(
        debounceTime(300),
        switchMap((f) => {
          if (f.subjectId && f.topicIds.length > 0) {
            return this.testsService.countQuestions(
              f.subjectId,
              f.topicIds,
              f.excludedTypes,
            );
          }
          return of({ count: 0 });
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => this.AvailableQuestionsCount.set(res.count));

    // Seleziona tutti gli argomenti di default quando viene cambiata/selezionata la materia
    effect(() => {
      const subject = this.SelectedSubject();
      if (subject?.topics) {
        this.SelectedTopicIds.set(new Set(subject.topics.map((t) => t._id)));
      } else {
        this.SelectedTopicIds.set(new Set());
      }
    }, { allowSignalWrites: true });
  }

  readonly IsFormValid = computed(
    () =>
      this.TestName().trim().length > 0 &&
      this.SelectedSubjectId().length > 0 &&
      this.SelectedTopicIds().size > 0 &&
      this.QuestionCount() >= 1 &&
      this.QuestionCount() <= 100 &&
      this.AvailableQuestionsCount() !== 0 &&
      (!this.TimeLimitEnabled() || this.TimeLimit() >= 1),
  );

  onSubjectChange(subjectId: string): void {
    this.SelectedSubjectId.set(subjectId);
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
        name: this.TestName().trim() || 'Auto-valutazione',
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
