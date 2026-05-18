import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfinity, faKey, faPlus } from '@fortawesome/pro-solid-svg-icons';
import {
  QuestionsDroppableList,
  QuestionWithPoints,
} from '../../components/questions-droppable-list/questions-droppable-list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchQuestions } from '../../components/search-questions/search-questions';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { ClassiService } from '../../../services/classi-service';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Materia } from '../../../services/materia';
import { TestsService, TestInterface } from '../../../services/tests-service';
import {
  QuestionsService,
  QuestionInterface,
} from '../../../services/questions';
import { FeedbackService } from '../../../services/feedback-service';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { QuestionsGridSelector } from '../../components/questions-grid-selector/questions-grid-selector';
import { TestPreviewModal } from '../../components/test-preview-modal/test-preview-modal';
import { forkJoin } from 'rxjs';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import { SyllexBadge } from '../../components/UI/syllex-badge/syllex-badge';
import { SyllexStepper } from '../../components/UI/syllex-stepper/syllex-stepper';

@Component({
  selector: 'app-create-edit-test',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SearchQuestions,
    ClassSelector,
    QuestionsSearchFilters,
    QuestionsGridSelector,
    SyllexPageHeader,
    SyllexButton,
    SyllexBadge,
    SyllexStepper,
  ],
  templateUrl: './create-edit-test.html',
  styleUrl: './create-edit-test.scss',
})
export class CreateEditTest implements OnInit {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly classiService = inject(ClassiService);
  private readonly offcanvasService = inject(NgbOffcanvas);
  readonly materiaService = inject(Materia);
  private readonly testsService = inject(TestsService);
  readonly questionsService = inject(QuestionsService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);

  // Icons
  readonly InfinityIcon = faInfinity;
  readonly GenPasswordIcon = faKey;
  readonly PlusIcon = faPlus;

  // Selected questions map for preview
  selectedQuestionsMap = new Map<string, QuestionInterface>();

  @ViewChild(QuestionsDroppableList)
  questionsComponent!: QuestionsDroppableList;

  // Data
  private readonly TestId = signal<string | null>(null);

  // UI State
  readonly IsLoading = signal<boolean>(false);
  readonly CurrentStep = signal<1 | 2 | 3>(1);
  readonly SelectedQuestionIds = signal<string[]>([]);
  readonly SelectedQuestionPoints = signal<Record<string, number>>({});
  readonly QuestionsToLoad = signal<
    { questionId: string; points: number }[] | undefined
  >(undefined);
  private readonly FormChanged = signal<number>(0);
  readonly StepDefs = [
    { n: 1, label: 'Configura' },
    { n: 2, label: 'Domande' },
    { n: 3, label: 'Finalizza' },
  ] as const;

  // Computed
  readonly IsEditMode = computed(() => !!this.TestId());
  readonly PageTitle = computed(() =>
    this.IsEditMode() ? 'Modifica Test di valutazione' : 'Crea test',
  );
  readonly HeaderDescription = computed(() => {
    const step = this.CurrentStep();
    if (step === 1) {
      return 'Step 1 di 3 - Imposta titolo, date e classi del test.';
    }
    if (step === 2) {
      return 'Step 2 di 3 - Seleziona le domande dalla banca.';
    }
    return 'Step 3 di 3 - Finalizza regole e pubblicazione.';
  });

  readonly TestForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    availableFrom: new FormControl(''),
    availableTo: new FormControl(''),
    classes: new FormControl([]),
    password: new FormControl(''),
    requiredScore: new FormControl(0, [Validators.min(1)]),
    time: new FormControl(0),
    randomizeQuestions: new FormControl(false),
    oneShotAnswers: new FormControl(false),
  });

  ngOnInit() {
    // Subscribe to form changes
    this.TestForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.FormChanged.update((v) => v + 1);
      });

    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const testId = params['testId'];
        if (testId) {
          this.TestId.set(testId);
          this.loadTest(testId);
        }
      });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const assignClassId = params['assign'];
        if (assignClassId && !this.IsEditMode()) {
          this.TestForm.get('classes')?.setValue([assignClassId]);
        }
      });
  }

  private loadTest(testId: string): void {
    this.IsLoading.set(true);
    this.testsService
      .getTestById(testId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.populateFormWithTest(response.test);
          this.IsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading test:', error);
          this.feedbackService.showFeedback(
            'Impossibile caricare il test',
            false,
          );
          this.router.navigate(['/t/tests']);
          this.IsLoading.set(false);
        },
      });
  }

  private populateFormWithTest(test: any): void {
    this.TestForm.patchValue({
      title: test.name,
      availableFrom: test.availableFrom
        ? this.formatDateForInput(test.availableFrom)
        : '',
      availableTo: test.availableTo
        ? this.formatDateForInput(test.availableTo)
        : '',
      classes: test.classIds || [],
      password: test.password || '',
      requiredScore: test.fitScore || 0,
      time: test.timeLimit !== undefined ? test.timeLimit : null,
      randomizeQuestions: test.randomizeQuestions ?? false,
      oneShotAnswers: test.oneShotAnswers ?? false,
    });

    if (test.questions && test.questions.length > 0) {
      this.QuestionsToLoad.set(test.questions);
      this.SelectedQuestionIds.set(
        test.questions.map((q: { questionId: string }) => q.questionId),
      );
      this.SelectedQuestionPoints.set(
        test.questions.reduce(
          (
            acc: Record<string, number>,
            q: { questionId: string; points?: number },
          ) => {
            acc[q.questionId] = q.points && q.points > 0 ? q.points : 1;
            return acc;
          },
          {},
        ),
      );
    }
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get assignedClasses(): string[] {
    return this.TestForm.get('classes')?.value || [];
  }

  get time(): number | null {
    return this.TestForm.get('time')?.value;
  }

  get maxScore(): number {
    const points = this.SelectedQuestionPoints();
    return this.SelectedQuestionIds().reduce(
      (sum, id) => sum + (points[id] ?? 1),
      0,
    );
  }

  readonly PublishBlockers = computed(() => {
    this.FormChanged();
    const form = this.TestForm.value;
    const blockers: string[] = [];
    if (!form.title) blockers.push('Inserisci un titolo');
    if (!form.availableFrom) blockers.push('Imposta la data di inizio');
    if (!form.classes?.length) blockers.push('Assegna almeno una classe');
    if (!this.SelectedQuestionIds().length)
      blockers.push('Seleziona almeno una domanda');
    if (!form.requiredScore || form.requiredScore <= 0)
      blockers.push('Imposta un punteggio di idoneità');
    if (form.requiredScore > this.maxScore)
      blockers.push(
        `Punteggio idoneità (${form.requiredScore}) maggiore del massimo (${this.maxScore})`,
      );
    return blockers;
  });

  readonly CanPublish = computed(() => this.PublishBlockers().length === 0);

  readonly CanSaveDraft = computed(() => {
    this.FormChanged(); // Trigger on form changes
    return !!this.TestForm.value.title;
  });

  readonly Step1Blockers = computed(() => {
    this.FormChanged();
    const form = this.TestForm.value;
    const blockers: string[] = [];

    if (!form.title) blockers.push('Inserisci un titolo');
    if (!form.availableFrom) blockers.push('Imposta la data di inizio');
    if (!form.classes?.length) blockers.push('Assegna almeno una classe');

    return blockers;
  });

  readonly CanGoNextToQuestions = computed(
    () => this.Step1Blockers().length === 0,
  );

  readonly CanGoNextToFinalize = computed(
    () => this.SelectedQuestionIds().length > 0,
  );

  readonly ShowFooterNext = computed(() => this.CurrentStep() < 3);

  readonly CanGoNext = computed(() => {
    const step = this.CurrentStep();
    if (step === 1) return this.CanGoNextToQuestions();
    if (step === 2) return this.CanGoNextToFinalize();
    return false;
  });

  goNextStep(): void {
    const step = this.CurrentStep();
    if (step === 1 && !this.CanGoNextToQuestions()) return;
    if (step === 2 && !this.CanGoNextToFinalize()) return;
    if (step < 3) this.CurrentStep.set((step + 1) as 1 | 2 | 3);
  }

  goPrevStep(): void {
    const step = this.CurrentStep();
    if (step > 1) this.CurrentStep.set((step - 1) as 1 | 2 | 3);
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.CurrentStep.set(1);
      return;
    }
    if (step === 2 && this.CanGoNextToQuestions()) {
      this.CurrentStep.set(2);
      return;
    }
    if (
      step === 3 &&
      this.CanGoNextToQuestions() &&
      this.CanGoNextToFinalize()
    ) {
      this.CurrentStep.set(3);
    }
  }

  onQuestionsChanged(questions: QuestionWithPoints[]): void {
    this.SelectedQuestionIds.set(questions.map((q) => q._id));
    this.SelectedQuestionPoints.set(
      questions.reduce<Record<string, number>>((acc, q) => {
        acc[q._id] = q.points && q.points > 0 ? q.points : 1;
        return acc;
      }, {}),
    );
  }

  onQuestionPointsChanged(payload: {
    questionId: string;
    points: number;
  }): void {
    this.SelectedQuestionPoints.update((prev) => ({
      ...prev,
      [payload.questionId]: payload.points,
    }));
  }

  onClassesChange(classIds: string[]): void {
    this.TestForm.get('classes')?.setValue(classIds);
  }

  onGeneratePassword(): void {
    this.TestForm.patchValue({
      password: Math.random().toString(36).slice(-8),
    });
  }

  onToggleUnlimitedTime(): void {
    const timeControl = this.TestForm.get('time');
    if (this.time !== null) {
      timeControl?.setValue(null);
      timeControl?.disable();
    } else {
      timeControl?.setValue(0);
      timeControl?.enable();
    }
  }

  getAvailabilitySummary(): string {
    const start = this.TestForm.get('availableFrom')?.value;
    const end = this.TestForm.get('availableTo')?.value;

    if (!start && !end) return 'Non impostata';
    if (start && end) {
      return `${this.formatDateLabel(start)} - ${this.formatDateLabel(end)}`;
    }
    if (start) return `Da ${this.formatDateLabel(start)}`;
    return `Fino a ${this.formatDateLabel(end)}`;
  }

  getTimeSummary(): string {
    const value = this.TestForm.get('time')?.value;
    if (value === null || value === undefined || value === '' || value <= 0) {
      return 'Illimitato';
    }
    return `${value} min`;
  }

  private formatDateLabel(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
    });
  }

  onResetForm(): void {
    this.TestForm.reset({
      title: '',
      availableFrom: '',
      availableTo: '',
      classes: [],
      password: '',
      requiredScore: 0,
      time: 0,
      randomizeQuestions: false,
      oneShotAnswers: false,
    });
    this.SelectedQuestionIds.set([]);
    this.SelectedQuestionPoints.set({});
    this.CurrentStep.set(1);
  }

  onSaveTest(asDraft: boolean = false): void {
    const selectedSubject = this.materiaService.materiaSelected();
    if (!selectedSubject) {
      this.feedbackService.showFeedback('Seleziona una materia', false);
      return;
    }

    this.IsLoading.set(true);
    const testData = this.prepareTestData(asDraft, selectedSubject._id);
    const request = this.IsEditMode()
      ? this.testsService.editTest(this.TestId()!, testData)
      : this.testsService.createTest(testData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const message = this.IsEditMode()
          ? 'Test aggiornato con successo!'
          : 'Test creato con successo!';
        this.feedbackService.showFeedback(message, true);
        this.router.navigate(['/t/tests']);
      },
      error: (error) => {
        console.error('Error saving test:', error);
        this.feedbackService.showFeedback(
          'Errore durante il salvataggio del test',
          false,
        );
        this.IsLoading.set(false);
      },
    });
  }

  private prepareTestData(asDraft: boolean, subjectId: string): TestInterface {
    const formValue = this.TestForm.value;
    const selectedIds = this.SelectedQuestionIds();
    const questionPoints = this.SelectedQuestionPoints();
    const questionsWithPoints = selectedIds.map((id) => ({
      questionId: id,
      points: questionPoints[id] ?? 1,
    }));

    const testData: TestInterface = {
      name: formValue.title,
      questions: questionsWithPoints,
      fitScore: formValue.requiredScore || 0,
      status: asDraft ? 'bozza' : 'pubblicato',
      subjectId: subjectId,
      classIds: formValue.classes || [],
    };

    if (formValue.availableFrom) {
      testData.availableFrom = new Date(formValue.availableFrom);
    }

    if (formValue.availableTo) {
      testData.availableTo = new Date(formValue.availableTo);
    }

    if (formValue.password?.trim()) {
      testData.password = formValue.password.trim();
    }

    if (formValue.time > 0) {
      testData.timeLimit = formValue.time;
    }

    testData.randomizeQuestions = !!formValue.randomizeQuestions;
    testData.oneShotAnswers = !!formValue.oneShotAnswers;

    return testData;
  }

  onAddQuestion(): void {
    this.router.navigate(['/t/create-question']);
  }

  onToggleQuestion(question: QuestionInterface): void {
    const currentIds = this.SelectedQuestionIds();
    if (currentIds.includes(question._id)) {
      this.SelectedQuestionIds.set(
        currentIds.filter((id) => id !== question._id),
      );
      this.SelectedQuestionPoints.update((prev) => {
        const next = { ...prev };
        delete next[question._id];
        return next;
      });
      this.selectedQuestionsMap.delete(question._id);
    } else {
      this.SelectedQuestionIds.set([...currentIds, question._id]);
      this.SelectedQuestionPoints.update((prev) => ({
        ...prev,
        [question._id]: prev[question._id] ?? 1,
      }));
      this.selectedQuestionsMap.set(question._id, question);
    }
  }

  onPreview(): void {
    const selectedIds = this.SelectedQuestionIds();

    // Verifichiamo se abbiamo tutti gli oggetti completi nel Map
    const missingIds = selectedIds.filter(
      (id) => !this.selectedQuestionsMap.has(id),
    );

    if (missingIds.length > 0) {
      this.IsLoading.set(true);
      // Carichiamo le domande mancanti
      const loadRequests = missingIds.map((id) =>
        this.questionsService.loadQuestion(id),
      );

      forkJoin(loadRequests).subscribe({
        next: (questions) => {
          questions.forEach((q) => this.selectedQuestionsMap.set(q._id, q));
          this.IsLoading.set(false);
          this.openPreviewModal();
        },
        error: () => {
          this.feedbackService.showFeedback(
            "Errore nel caricamento dell'anteprima",
            false,
          );
          this.IsLoading.set(false);
        },
      });
    } else {
      this.openPreviewModal();
    }
  }

  private openPreviewModal(): void {
    const modalRef = this.modalService.open(TestPreviewModal, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'test-preview-modal',
    });

    const selectedIds = this.SelectedQuestionIds();
    const sortedQuestions = selectedIds
      .map((id) => this.selectedQuestionsMap.get(id)!)
      .filter((q) => !!q);

    modalRef.componentInstance.testTitle = this.TestForm.get('title')?.value;
    modalRef.componentInstance.questions = sortedQuestions;

    modalRef.result.then(
      (result) => {
        if (result === 'save') {
          this.onSaveTest(false);
        }
      },
      () => {},
    );
  }

  onRequestAIGeneration(): void {
    const offcanvasRef = this.offcanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
    });
    offcanvasRef.componentInstance.type = 'questions';
    offcanvasRef.closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((questions: QuestionWithPoints[]) => {
        if (questions?.length) {
          const newIds = questions.map((q) => q._id);
          this.SelectedQuestionIds.update((ids) => [
            ...ids,
            ...newIds.filter((id) => !ids.includes(id)),
          ]);
          this.SelectedQuestionPoints.update((pts) => {
            const updated = { ...pts };
            for (const q of questions) {
              if (!(q._id in updated)) {
                updated[q._id] = q.points ?? 1;
              }
            }
            return updated;
          });
        }
      });
  }
}
