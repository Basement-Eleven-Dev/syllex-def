import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faImage,
  faPencil,
  faSave,
  faSparkles,
  faSpinnerThird,
  faTag,
  faXmark,
  faSpellCheck,
  faSquareCheck,
  faMarker,
} from '@fortawesome/pro-solid-svg-icons';
import { MultipleChoiceOptions } from '../../components/multiple-choice-options/multiple-choice-options';
import {
  QuestionDifficulty,
} from '../../../types/question.types';
import { TypeSelector } from '../../components/type-selector/type-selector';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import { SyllexCard } from '../../components/UI/syllex-card/syllex-card';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexSelectInput } from '../../components/UI/syllex-select-input/syllex-select-input';
import { SyllexStepper } from '../../components/UI/syllex-stepper/syllex-stepper';
import { Materia } from '../../../services/materia';
import { QuestionsService } from '../../../services/questions';
import { FeedbackService } from '../../../services/feedback-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SyllexErrorModalComponent } from '../../../directives/syllex-error-modal.component';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { AiService, GeneratedQuestion } from '../../../services/ai-service';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import {
  trigger,
  style,
  transition,
  animate,
} from '@angular/animations';
import { firstValueFrom } from 'rxjs';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

export interface AnswerOption {
  label: string;
  isCorrect: boolean;
}

interface ReviewQuestion {
  id: string;
  data: GeneratedQuestion;
  selected: boolean;
}

interface StepDef {
  n: number;
  label: string;
}

@Component({
  selector: 'app-create-edit-question',
  standalone: true,
  imports: [
    FontAwesomeModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MultipleChoiceOptions,
    TypeSelector,
    SyllexButton,
    SyllexCard,
    SyllexPageHeader,
    SyllexSelectInput,
    SyllexStepper,
    TourAnchorNgBootstrapDirective,
    MaterialiSelector,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './create-edit-question.html',
  styleUrl: './create-edit-question.scss',
  animations: [
    trigger('stepIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '260ms 100ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
      transition(':leave', [
        style({ position: 'absolute', top: 0, left: 0, right: 0, opacity: 1 }),
        animate(
          '180ms ease-in',
          style({ opacity: 0, transform: 'translateX(-20px)' }),
        ),
      ]),
    ]),
  ],
})
export class CreateEditQuestion {
  // Services
  private readonly activatedRoute = inject(ActivatedRoute);
  readonly materiaService = inject(Materia);
  private readonly questionsService = inject(QuestionsService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly aiService = inject(AiService);
  private readonly modalService = inject(NgbModal);
  private readonly translocoService = inject(TranslocoService);

  @ViewChild(MaterialiSelector) private materialiSelector!: MaterialiSelector;

  // Icons
  readonly ArrowLeftIcon = faArrowLeft;
  readonly SparklesIcon = faSparkles;
  readonly ImageIcon = faImage;
  readonly SaveIcon = faSave;
  readonly SpinnerIcon = faSpinnerThird;
  readonly TagIcon = faTag;
  readonly RemoveIcon = faXmark;
  readonly PencilIcon = faPencil;
  readonly CheckIcon = faCheck;
  readonly ChevronLeftIcon = faChevronLeft;
  readonly ChevronRightIcon = faChevronRight;

  // Data
  readonly QuestionTypeOptions = computed(() => [
    {
      label: this.translocoService.translate('create_edit_question.types.scelta_multipla.label') || 'Scelta multipla',
      description: this.translocoService.translate('create_edit_question.types.scelta_multipla.desc') || 'Domande con più opzioni di risposta, di cui una corretta',
      icon: faSpellCheck,
      value: 'scelta multipla',
    },
    {
      label: this.translocoService.translate('create_edit_question.types.vero_falso.label') || 'Vero o falso',
      description: this.translocoService.translate('create_edit_question.types.vero_falso.desc') || 'Domande a cui rispondere con Vero o Falso',
      icon: faSquareCheck,
      value: 'vero falso',
    },
    {
      label: this.translocoService.translate('create_edit_question.types.risposta_aperta.label') || 'Risposta aperta',
      description: this.translocoService.translate('create_edit_question.types.risposta_aperta.desc') || 'Domande che richiedono una risposta testuale libera',
      icon: faMarker,
      value: 'risposta aperta',
    },
  ]);

  readonly DifficultyOptions = computed(() => [
    { value: 'elementary', label: this.translocoService.translate('create_edit_question.difficulty_elementary') || 'Elementare' },
    { value: 'easy', label: this.translocoService.translate('create_edit_question.difficulty_easy') || 'Facile' },
    { value: 'medium', label: this.translocoService.translate('create_edit_question.difficulty_medium') || 'Media' },
    { value: 'hard', label: this.translocoService.translate('create_edit_question.difficulty_hard') || 'Difficile' },
    { value: 'very_hard', label: this.translocoService.translate('create_edit_question.difficulty_very_hard') || 'Molto difficile' },
  ]);

  readonly LanguageOptions = [
    { value: 'it', label: 'Italiano' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
  ];
  readonly PolicyOptions = computed(() => [
    { value: 'public', label: this.translocoService.translate('create_edit_question.policy_public') || 'Esercitazione' },
    { value: 'private', label: this.translocoService.translate('create_edit_question.policy_private') || 'Uso Test' },
  ]);
  private readonly QuestionId = this.activatedRoute.snapshot.paramMap.get('id');
  private CurrentQuestionId = signal<string | null>(null);

  // UI State
  readonly CurrentStep = signal<number>(1);
  readonly SelectedMethod = signal<'ai' | 'manual' | null>(null);
  readonly SelectedQuestionType = signal<string>('');
  readonly SelectedPolicyType = signal<string>('public');
  readonly ImagePreview = signal<string | null>(null);
  readonly IsDragging = signal<boolean>(false);
  readonly IsLoading = signal<boolean>(false);
  readonly AiIsLoading = signal<boolean>(false);
  readonly AiIsReviewing = signal<boolean>(false);
  readonly AiReviewQuestions = signal<ReviewQuestion[]>([]);
  readonly IsSavingBatch = signal<boolean>(false);
  readonly PartialWarningCount = signal<number>(0);
  private UploadedImageFile = signal<File | null>(null);
  // Reactive form validity signals (computed can't track FormGroup values)
  readonly ManualFormValues = signal<Record<string, unknown>>({});

  // Computed — steps
  readonly IsEditMode = computed(() => !!this.QuestionId);
  readonly TotalSteps = computed(() =>
    this.SelectedMethod() === 'ai' ? 2 : 4,
  );
  readonly StepDefs = computed<StepDef[]>(() =>
    this.SelectedMethod() === 'ai'
      ? [
          { n: 1, label: this.translocoService.translate('create_edit_question.step_type') || 'Tipo' },
          { n: 2, label: this.translocoService.translate('create_edit_question.step_generate') || 'Genera' },
        ]
      : [
          { n: 1, label: this.translocoService.translate('create_edit_question.step_type') || 'Tipo' },
          { n: 2, label: this.translocoService.translate('create_edit_question.step_content') || 'Contenuto' },
          { n: 3, label: this.translocoService.translate('create_edit_question.step_answer') || 'Risposta' },
          { n: 4, label: this.translocoService.translate('create_edit_question.step_publish') || 'Pubblica' },
        ],
  );
  // Manual step 3 valid — needs options check (was step 4)
  readonly Step3Valid = computed(() => {
    const vals = this.ManualFormValues();
    const type = this.SelectedQuestionType();
    if (type === 'risposta aperta') return true;
    if (type === 'vero falso')
      return (vals['correctAnswer'] as boolean | null) !== null;
    if (type === 'scelta multipla')
      return ((vals['options'] as AnswerOption[]) || []).some(
        (o) => o.isCorrect,
      );
    return false;
  });

  readonly PageTitle = computed(() =>
    this.IsEditMode()
      ? this.translocoService.translate('create_edit_question.title_edit') || 'Modifica domanda'
      : this.translocoService.translate('create_edit_question.title_create') || 'Crea nuova domanda',
  );
  readonly PageDescription = computed(() =>
    this.IsEditMode()
      ? this.translocoService.translate('create_edit_question.desc_edit') || 'Modifica i dettagli della domanda selezionata.'
      : this.translocoService.translate('create_edit_question.desc_create') || 'Crea la tua domanda in pochi passi guidati.',
  );
  readonly SaveButtonLabel = computed(() =>
    this.IsEditMode()
      ? this.translocoService.translate('create_edit_question.btn_save_question_update') || 'Aggiorna domanda'
      : this.translocoService.translate('create_edit_question.btn_save_question_create') || 'Salva domanda',
  );
  readonly IsAiFormMultipleChoice = computed(
    () => this.SelectedQuestionType() === 'scelta multipla',
  );

  // Computed — AI review
  readonly AllSelected = computed(() =>
    this.AiReviewQuestions().every((q) => q.selected),
  );
  readonly AnySelected = computed(() =>
    this.AiReviewQuestions().some((q) => q.selected),
  );
  readonly SelectedCount = computed(
    () => this.AiReviewQuestions().filter((q) => q.selected).length,
  );

  // Computed — navigation
  readonly CanGoNext = computed(() => {
    const step = this.CurrentStep();
    const method = this.SelectedMethod();
    if (step === 1) return !!this.SelectedQuestionType();
    if (step === 2 && method === 'manual') {
      const vals = this.ManualFormValues();
      return !!(vals['topicId'] && (vals['text'] as string)?.trim());
    }
    if (step === 3 && method === 'manual') return this.Step3Valid();
    return false;
  });
  readonly ShowNextArrow = computed(() => {
    if (!this.SelectedMethod()) return false;
    if (this.SelectedMethod() === 'ai' && this.CurrentStep() === 2)
      return false;
    if (
      this.SelectedMethod() === 'manual' &&
      this.CurrentStep() === this.TotalSteps()
    )
      return false;
    return true;
  });

  // Forms
  readonly QuestionForm: FormGroup = new FormGroup({
    type: new FormControl('', Validators.required),
    text: new FormControl('', Validators.required),
    topicId: new FormControl('', Validators.required),
    difficulty: new FormControl<QuestionDifficulty>('medium'),
    explanation: new FormControl(''),
    options: new FormControl([
      { label: 'Opzione 1', isCorrect: false },
      { label: 'Opzione 2', isCorrect: false },
      { label: 'Opzione 3', isCorrect: false },
      { label: 'Opzione 4', isCorrect: false },
    ]),
    policy: new FormControl('public'),
    correctAnswer: new FormControl(null),
    tags: new FormControl<string[]>([]),
  });

  readonly aiForm: FormGroup = new FormGroup({
    topicId: new FormControl('', Validators.required),
    language: new FormControl('it', Validators.required),
    difficulty: new FormControl<QuestionDifficulty>(
      'medium',
      Validators.required,
    ),
    policy: new FormControl('public', Validators.required),
    numberOfQuestions: new FormControl(3, [
      Validators.required,
      Validators.min(1),
      Validators.max(20),
    ]),
    numberOfAlternatives: new FormControl(4),
    instructions: new FormControl(''),
  });

  readonly TagInput = signal<string>('');

  constructor() {
    if (this.QuestionId) {
      this.loadQuestion(this.QuestionId);
    }
    // Keep ManualFormValues in sync so computed signals that depend on it re-evaluate
    this.QuestionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vals) => {
        this.ManualFormValues.set(vals);
      });
    this.QuestionForm.get('type')?.valueChanges.subscribe((type) => {
      this.updateFormValidators(type);
    });
  }

  // ─── Navigation ──────────────────────────────────────

  goNext(): void {
    if (!this.CanGoNext()) return;
    if (this.CurrentStep() < this.TotalSteps()) {
      this.CurrentStep.update((s) => s + 1);
    }
  }

  goPrev(): void {
    if (this.AiIsReviewing()) {
      this.AiIsReviewing.set(false);
      return;
    }
    if (this.CurrentStep() === 1) {
      // Back to pre-step card selection
      this.SelectedMethod.set(null);
      this.CurrentStep.set(1);
      return;
    }
    if (this.CurrentStep() > 1) {
      this.CurrentStep.update((s) => s - 1);
    }
  }

  // ─── Method / Type selection ─────────────────────────

  onSelectMethod(method: 'ai' | 'manual'): void {
    this.SelectedMethod.set(method);
    this.AiIsReviewing.set(false);
    this.AiReviewQuestions.set([]);
    this.PartialWarningCount.set(0);
    this.CurrentStep.set(1);
  }

  onSelectQuestionType(type: string): void {
    this.SelectedQuestionType.set(type);
    this.QuestionForm.patchValue({ type });
    this.updateFormValidators(type);
    this.AiIsReviewing.set(false);
    this.AiReviewQuestions.set([]);
    this.PartialWarningCount.set(0);
    // Auto-advance from step 1 (type selection)
    if (this.CurrentStep() === 1) {
      setTimeout(() => this.goNext(), 280);
    }
  }

  onSelectPolicyType(policy: string): void {
    this.SelectedPolicyType.set(policy);
    this.QuestionForm.patchValue({ policy });
  }

  // ─── AI generation ───────────────────────────────────

  async onGenerateAI(): Promise<void> {
    if (this.aiForm.invalid) return;
    this.AiIsLoading.set(true);

    try {
      const {
        topicId,
        language,
        difficulty,
        numberOfQuestions,
        numberOfAlternatives,
        instructions,
      } = this.aiForm.value;
      const materialIds = this.materialiSelector
        ? [...this.materialiSelector.selectedMaterialIds()]
        : [];

      const { questions, failedCount } = await this.aiService.generateQuestions(
        {
          type: this.SelectedQuestionType() as any,
          topicId,
          materialIds,
          instructions: instructions || undefined,
          language,
          difficulty,
          numberOfAlternatives: this.IsAiFormMultipleChoice()
            ? numberOfAlternatives
            : undefined,
        },
        numberOfQuestions,
      );

      if (questions.length === 0) {
        this.feedbackService.showFeedback(
          this.translocoService.translate('create_edit_question.err_ai_empty'),
          false,
        );
        return;
      }

      this.PartialWarningCount.set(failedCount);
      this.AiReviewQuestions.set(
        questions.map((q, i) => ({
          id: `temp-${i}-${Date.now()}`,
          data: q,
          selected: true,
        })),
      );
      this.AiIsReviewing.set(true);
    } catch (error) {
      const errMsg = this.aiService.extractErrorMessage(error);
      if (errMsg.toLowerCase().includes('non contiene testo sufficiente')) {
        const modalRef = this.modalService.open(SyllexErrorModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        });
        modalRef.componentInstance.title = this.translocoService.translate('create_edit_question.error_modal_title');
        modalRef.componentInstance.message = errMsg;
        modalRef.componentInstance.buttonText = this.translocoService.translate('create_edit_question.error_modal_btn');
      } else {
        this.feedbackService.showFeedback(errMsg, false);
      }
    } finally {
      this.AiIsLoading.set(false);
    }
  }

  toggleQuestion(id: string): void {
    this.AiReviewQuestions.update((list) =>
      list.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)),
    );
  }

  toggleAll(): void {
    const all = this.AllSelected();
    this.AiReviewQuestions.update((list) =>
      list.map((q) => ({ ...q, selected: !all })),
    );
  }

  async onConfirmAiSelection(): Promise<void> {
    const selected = this.AiReviewQuestions().filter((q) => q.selected);
    if (!selected.length) return;

    this.IsSavingBatch.set(true);
    const subjectId = this.materiaService.materiaSelected()?._id;
    const topicId = this.aiForm.get('topicId')?.value;
    const difficulty = this.aiForm.get('difficulty')?.value;
    const policy = this.aiForm.get('policy')?.value || 'public';
    let savedCount = 0;

    for (const item of selected) {
      try {
        const resolvedTopicId = item.data.topicId || topicId;
        const questionData: any = {
          type: item.data.type,
          text: item.data.text,
          explanation: item.data.explanation,
          topicId: resolvedTopicId,
          difficulty,
          subjectId,
          policy,
          tags: [],
          sourceMaterialId: item.data.sourceMaterialId,
          aiGenerated: true,
        };
        if (item.data.type === 'scelta multipla')
          questionData.options = item.data.options;
        if (item.data.type === 'vero falso')
          questionData.correctAnswer = item.data.correctAnswer;
        await firstValueFrom(
          this.questionsService.createQuestion(questionData),
        );
        savedCount++;
      } catch {
        // continue with remaining
      }
    }

    this.IsSavingBatch.set(false);
    const successMsg = this.translocoService.translate('create_edit_question.save_batch_success', {
      count: savedCount,
      word: savedCount === 1 
        ? this.translocoService.translate('create_edit_question.save_batch_word_singular')
        : this.translocoService.translate('create_edit_question.save_batch_word_plural')
    });
    this.feedbackService.showFeedback(successMsg, true);
    window.history.back();
  }

  // ─── Manual question save ────────────────────────────

  onSaveQuestion(): void {
    if (this.QuestionForm.invalid) {
      this.QuestionForm.markAllAsTouched();
      return;
    }

    this.IsLoading.set(true);
    const questionData = this.prepareQuestionData();
    const serviceCall = this.CurrentQuestionId()
      ? this.questionsService.editQuestion(
          this.CurrentQuestionId()!,
          questionData,
          this.UploadedImageFile() || undefined,
        )
      : this.questionsService.createQuestion(
          questionData,
          this.UploadedImageFile() || undefined,
        );

    serviceCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const message = this.CurrentQuestionId()
          ? this.translocoService.translate('create_edit_question.success_save_update')
          : this.translocoService.translate('create_edit_question.success_save_create');
        this.feedbackService.showFeedback(message, true);
        this.IsLoading.set(false);
        window.history.back();
      },
      error: () => {
        this.feedbackService.showFeedback(
          this.translocoService.translate('create_edit_question.err_save'),
          false,
        );
        this.IsLoading.set(false);
      },
    });
  }

  private prepareQuestionData(): any {
    const questionData = { ...this.QuestionForm.value };
    if (questionData.type !== 'scelta multipla') delete questionData.options;
    if (questionData.type !== 'vero falso') delete questionData.correctAnswer;
    questionData.subjectId = this.materiaService.materiaSelected()?._id;
    if (this.ImagePreview() && !this.UploadedImageFile()) {
      questionData.imageUrl = this.ImagePreview();
    }
    return questionData;
  }

  // ─── Answer options ──────────────────────────────────

  get questionOptions(): AnswerOption[] {
    return this.QuestionForm.get('options')?.value || [];
  }

  onOptionsChange(options: AnswerOption[]): void {
    this.QuestionForm.patchValue({ options });
  }

  onSelectCorrectAnswer(value: boolean): void {
    this.QuestionForm.patchValue({ correctAnswer: value });
  }

  // ─── Tags ────────────────────────────────────────────

  addTag(): void {
    const value = this.TagInput().trim().toLowerCase();
    if (!value) return;
    const current: string[] = this.QuestionForm.get('tags')?.value || [];
    if (!current.includes(value)) {
      this.QuestionForm.patchValue({ tags: [...current, value] });
    }
    this.TagInput.set('');
  }

  removeTag(tag: string): void {
    const current: string[] = this.QuestionForm.get('tags')?.value || [];
    this.QuestionForm.patchValue({ tags: current.filter((t) => t !== tag) });
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  // ─── Drag & drop image ───────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.IsDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.IsDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.IsDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.handleFile(files[0]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.handleFile(input.files[0]);
  }

  private handleFile(file: File): void {
    if (!this.validateFile(file)) return;
    this.UploadedImageFile.set(file);
    this.createImagePreview(file);
  }

  private validateFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.feedbackService.showFeedback(
        this.translocoService.translate('create_edit_question.err_image_invalid'),
        false,
      );
      return false;
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      this.feedbackService.showFeedback(
        this.translocoService.translate('create_edit_question.err_image_size'),
        false,
      );
      return false;
    }
    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => this.ImagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.ImagePreview.set(null);
    this.UploadedImageFile.set(null);
  }

  // ─── Edit mode ───────────────────────────────────────

  private loadQuestion(questionId: string): void {
    this.questionsService
      .loadQuestion(questionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (question) => {
          this.CurrentQuestionId.set(question._id);
          this.populateFormWithQuestion(question);
        },
        error: () => {
          this.feedbackService.showFeedback(
            this.translocoService.translate('create_edit_question.err_load'),
            false,
          );
        },
      });
  }

  private populateFormWithQuestion(question: any): void {
    this.SelectedMethod.set('manual');
    this.CurrentStep.set(2); // start at content step in edit mode
    this.QuestionForm.patchValue({
      type: question.type,
      text: question.text,
      topicId: question.topicId,
      difficulty: question.difficulty || 'medium',
      explanation: question.explanation,
      policy: question.policy,
    });
    this.SelectedQuestionType.set(question.type);
    if (question.policy) this.SelectedPolicyType.set(question.policy);
    if (question.type === 'scelta multipla' && question.options) {
      this.QuestionForm.patchValue({ options: question.options });
    }
    if (
      question.type === 'vero falso' &&
      question.correctAnswer !== undefined
    ) {
      this.QuestionForm.patchValue({ correctAnswer: question.correctAnswer });
    }
    if (question.imageUrl) this.ImagePreview.set(question.imageUrl);
    if (question.tags) this.QuestionForm.patchValue({ tags: question.tags });
  }

  private updateFormValidators(type: string): void {
    const correctAnswerControl = this.QuestionForm.get('correctAnswer');
    const optionsControl = this.QuestionForm.get('options');
    if (type === 'vero falso') {
      correctAnswerControl?.setValidators([Validators.required]);
      optionsControl?.clearValidators();
    } else if (type === 'scelta multipla') {
      correctAnswerControl?.clearValidators();
      optionsControl?.setValidators([Validators.required]);
    } else {
      correctAnswerControl?.clearValidators();
      optionsControl?.clearValidators();
    }
    correctAnswerControl?.updateValueAndValidity();
    optionsControl?.updateValueAndValidity();
  }
}
