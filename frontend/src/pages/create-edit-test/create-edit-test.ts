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
import {
  faInfinity,
  faKey,
  faPenRuler,
  faSave,
  faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import { QuestionsDroppableList } from '../../components/questions-droppable-list/questions-droppable-list';
import { SearchQuestions } from '../../components/search-questions/search-questions';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { ClassiService } from '../../services/classi-service';
import { BackTo } from '../../components/back-to/back-to';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Materia } from '../../services/materia';
import { TestsService, TestInterface } from '../../services/tests-service';
import { FeedbackService } from '../../services/feedback-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';

@Component({
  selector: 'app-create-edit-test',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SearchQuestions,
    QuestionsDroppableList,
    ClassSelector,
    BackTo,
    QuestionsSearchFilters,
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
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  // Icons
  readonly InfinityIcon = faInfinity;
  readonly GenPasswordIcon = faKey;
  readonly DraftIcon = faPenRuler;
  readonly SaveIcon = faSave;
  readonly SparklesIcon = faSparkles;

  @ViewChild(QuestionsDroppableList)
  questionsComponent!: QuestionsDroppableList;

  // Data
  private readonly TestId = signal<string | null>(null);

  // UI State
  readonly IsLoading = signal<boolean>(false);
  readonly QuestionsToLoad = signal<
    { questionId: string; points: number }[] | undefined
  >(undefined);
  private readonly FormChanged = signal<number>(0);

  // Computed
  readonly IsEditMode = computed(() => !!this.TestId());
  readonly PageTitle = computed(() =>
    this.IsEditMode()
      ? 'Modifica Test di valutazione'
      : 'Nuovo Test di valutazione',
  );

  readonly TestForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    availableFrom: new FormControl(''),
    availableTo: new FormControl(''),
    classes: new FormControl([]),
    password: new FormControl(''),
    requiredScore: new FormControl(0, [Validators.min(1)]),
    time: new FormControl(0),
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
    });

    if (test.questions && test.questions.length > 0) {
      this.QuestionsToLoad.set(test.questions);
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
    if (!this.questionsComponent?.selectedQuestions) return 0;
    const questionCardsArray =
      this.questionsComponent.questionCards?.toArray() || [];
    return this.questionsComponent.selectedQuestions.reduce(
      (total, q, index) => {
        return total + (questionCardsArray[index]?.points || 1);
      },
      0,
    );
  }

  readonly CanPublish = computed(() => {
    this.FormChanged(); // Trigger on form changes
    const form = this.TestForm.value;
    return !!(
      form.title &&
      form.availableFrom &&
      form.classes?.length > 0 &&
      this.questionsComponent?.selectedQuestions?.length > 0 &&
      form.requiredScore > 0 &&
      form.requiredScore <= this.maxScore
    );
  });

  readonly CanSaveDraft = computed(() => {
    this.FormChanged(); // Trigger on form changes
    return !!this.TestForm.value.title;
  });

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
    const questionsWithPoints = this.questionsComponent.selectedQuestions.map(
      (q, index) => {
        const questionCardsArray =
          this.questionsComponent.questionCards?.toArray() || [];
        return {
          questionId: q._id,
          points: questionCardsArray[index]?.points || 1,
        };
      },
    );

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

    return testData;
  }

  onRequestAIGeneration(): void {
    const offcanvasRef = this.offcanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
    });
    offcanvasRef.componentInstance.type = 'questions';
  }
}
