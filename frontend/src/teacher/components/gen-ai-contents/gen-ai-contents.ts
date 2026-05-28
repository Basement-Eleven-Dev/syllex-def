import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  Optional,
  signal,
  TemplateRef,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckDouble,
  faTimes,
  faSparkles,
  faSpinnerThird,
  faCircleQuestion,
} from '@fortawesome/pro-solid-svg-icons';
import { Materia } from '../../../services/materia';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';
import { TypeSelector, TypeOption } from '../type-selector/type-selector';
import {
  QUESTION_TYPE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  MaterialType,
  QuestionType,
  QuestionDifficulty,
} from '../../../types/question.types';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveOffcanvas, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AiService,
  GeneratedMaterial,
  GeneratedQuestion,
} from '../../../services/ai-service';
import { QuestionWithPoints } from '../questions-droppable-list/questions-droppable-list';
import {
  QuestionInterface,
  QuestionsService,
} from '../../../services/questions';
import { Auth } from '../../../services/auth';
import { FeedbackService } from '../../../services/feedback-service';
import { forkJoin } from 'rxjs';
import { QuestionCard } from '../question-card/question-card';
import { AiOverlay } from '../ai-overlay/ai-overlay';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { SyllexButton } from '../UI/syllex-button/syllex-button';
import { MaterialiFacadeService } from '../../../services/materiali/materiali-facade.service';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { SyllexErrorModalComponent } from '../../../directives/syllex-error-modal.component';

interface ReviewQuestion {
  readonly TempId: string;
  /** Already shaped as QuestionInterface (TempId used as _id for display). */
  readonly data: QuestionInterface;
  Selected: boolean;
}

@Component({
  selector: 'app-gen-ai-contents',
  imports: [
    FontAwesomeModule,
    MaterialiSelector,
    TypeSelector,
    ReactiveFormsModule,
    QuestionCard,
    AiOverlay,
    TourAnchorNgBootstrapDirective,
    SyllexButton,
  ],
  templateUrl: './gen-ai-contents.html',
  styleUrl: './gen-ai-contents.scss',
})
export class GenAiContents implements OnInit {
  @Input() set type(value: 'questions' | 'materials') {
    this.TypeMode.set(value);
    this.updateValidatorsForMode(value);
  }
  @ViewChild(MaterialiSelector) materialiSelector!: MaterialiSelector;
  @ViewChild('materialSuccessModal')
  materialSuccessModal!: TemplateRef<unknown>;

  readonly materiaService = inject(Materia);
  readonly aiService = inject(AiService);
  readonly questionsService = inject(QuestionsService);
  readonly auth = inject(Auth);
  readonly feedbackService = inject(FeedbackService);
  readonly modalService = inject(NgbModal);
  readonly router = inject(Router);
  readonly materialiFacade = inject(MaterialiFacadeService);
  @Optional() readonly activeOffcanvas = inject(NgbActiveOffcanvas, {
    optional: true,
  });

  private readonly destroyRef = inject(DestroyRef);
  readonly formInvalid = signal<boolean>(true);

  // Icons
  readonly SparklesIcon = faSparkles;
  readonly SpinnerIcon = faSpinnerThird;
  readonly TimesIcon = faTimes;
  readonly CheckAllIcon = faCheckDouble;
  readonly QuestionIcon = faCircleQuestion;

  @ViewChild('whyMaterialsModal') whyMaterialsModal!: TemplateRef<any>;

  openWhyMaterialsModal(): void {
    this.modalService.open(this.whyMaterialsModal, {
      centered: true,
      size: 'md',
    });
  }

  // State
  readonly TypeMode = signal<'questions' | 'materials'>('materials');
  readonly SelectedType = signal<string>('');
  readonly Types = signal<TypeOption[]>([]);
  readonly IsGenerating = signal<boolean>(false);
  readonly GenerationSuccess = signal<boolean>(false);
  readonly IsSaving = signal<boolean>(false);
  readonly IsOffcanvasMode = signal<boolean>(false);
  readonly ReviewQuestions = signal<ReviewQuestion[]>([]);
  readonly ReviewMode = signal<boolean>(false);
  readonly GeneratedMaterial = signal<GeneratedMaterial | null>(null);
  /** Number of questions that failed to generate in the last bulk request. */
  readonly PartialGenerationWarning = signal<number>(0);
  readonly selectedMaterials = signal<MaterialInterface[]>([]);

  // Computed
  readonly IsMultipleChoice = computed(
    () => this.SelectedType() === 'scelta multipla',
  );
  readonly IsSlides = computed(
    () => this.TypeMode() === 'materials' && this.SelectedType() === 'slides',
  );
  readonly disableReason = computed(() => {
    const reasons: string[] = [];
    
    if (this.selectedMaterials().length === 0) {
      reasons.push('Seleziona almeno una risorsa o materiale di riferimento.');
    }
    
    if (this.TypeMode() === 'questions' && !this.genForm.get('topicId')?.value) {
      reasons.push('Seleziona un argomento per le domande.');
    }
    
    if (this.formInvalid()) {
      const topicInvalid = this.TypeMode() === 'questions' && !this.genForm.get('topicId')?.value;
      if (!topicInvalid) {
        reasons.push('Compila correttamente tutti i parametri richiesti.');
      }
    }
    
    return reasons;
  });
  readonly submitButtonProps = computed(() => ({
    label: this.IsGenerating() ? 'Generazione in corso...' : 'Genera ' + this.getSelectedTypeName(),
    variant: 'primary' as const,
    size: 'large' as const,
    disabled: this.formInvalid() || this.selectedMaterials().length === 0 || this.IsGenerating(),
    leftIcon: this.IsGenerating() ? this.SpinnerIcon : this.SparklesIcon,
  }));
  readonly SelectedCount = computed(
    () => this.ReviewQuestions().filter((q) => q.Selected).length,
  );
  readonly AllSelected = computed(() =>
    this.ReviewQuestions().every((q) => q.Selected),
  );
  readonly AnySelected = computed(() =>
    this.ReviewQuestions().some((q) => q.Selected),
  );

  readonly genForm: FormGroup = new FormGroup({
    topicId: new FormControl('', [Validators.required]),
    selectedType: new FormControl('', [Validators.required]),
    numberOfQuestions: new FormControl(5, [
      Validators.required,
      Validators.min(1),
      Validators.max(20),
    ]),
    numberOfSlides: new FormControl(10, [
      Validators.min(3),
      Validators.max(30),
    ]),
    format: new FormControl('pptx'),
    language: new FormControl('italiano', [Validators.required]),
    difficulty: new FormControl<QuestionDifficulty>('medium', [
      Validators.required,
    ]),
    numberOfAlternatives: new FormControl(4),
    instructions: new FormControl(''),
  });

  ngOnInit(): void {
    this.IsOffcanvasMode.set(!!this.activeOffcanvas);
    this.Types.set(
      this.TypeMode() === 'materials'
        ? MATERIAL_TYPE_OPTIONS
        : QUESTION_TYPE_OPTIONS,
    );
    const firstType = this.Types()[0].value;
    this.SelectedType.set(firstType);
    this.genForm.controls['selectedType'].setValue(firstType);
    this.updateValidatorsForMode(this.TypeMode());

    // Sync validity with formInvalid signal to reactively update computed CTA props
    this.genForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formInvalid.set(this.genForm.invalid);
      });
    // Set initial state
    this.formInvalid.set(this.genForm.invalid);
  }

  private updateValidatorsForMode(mode: 'questions' | 'materials'): void {
    const topicIdCtrl = this.genForm.controls['topicId'];
    if (mode === 'materials') {
      topicIdCtrl.clearValidators();
    } else {
      topicIdCtrl.setValidators([Validators.required]);
    }
    topicIdCtrl.updateValueAndValidity();
  }

  getSelectedTypeName(): string {
    return (
      this.Types().find((t) => t.value === this.SelectedType())?.label ?? ''
    );
  }

  onTypeSelected(value: string): void {
    this.SelectedType.set(value);
    this.genForm.controls['selectedType'].setValue(value);
  }

  onMaterialsSelectionChange(materials: MaterialInterface[]): void {
    this.selectedMaterials.set(materials || []);
  }

  async onSubmit(): Promise<void> {
    if (this.IsGenerating() || this.genForm.invalid) {
      this.genForm.markAllAsTouched();
      return;
    }
    this.IsGenerating.set(true);
    try {
      if (this.TypeMode() === 'materials') {
        await this.submitMaterialGeneration();
      } else {
        await this.submitQuestionGeneration();
      }
    } catch (error) {
      const errMsg = this.getUserFacingErrorMessage(error);
      if (errMsg.toLowerCase().includes('non contiene testo sufficiente')) {
        const modalRef = this.modalService.open(SyllexErrorModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        });
        modalRef.componentInstance.title = 'Generazione Impedita';
        modalRef.componentInstance.message = errMsg;
        modalRef.componentInstance.buttonText = 'Ho capito, riprovo';
      } else {
        this.feedbackService.showFeedback(errMsg, false);
      }
      this.IsGenerating.set(false);
    }
  }

  private getUserFacingErrorMessage(error: unknown): string {
    return this.aiService.extractErrorMessage(error);
  }

  private async submitQuestionGeneration(): Promise<void> {
    const {
      topicId,
      selectedType,
      numberOfQuestions,
      language,
      difficulty,
      numberOfAlternatives,
      instructions,
    } = this.genForm.value;

    const materialIds = [...this.materialiSelector.selectedMaterialIds()];
    const subjectId = localStorage.getItem('selectedSubjectId') ?? '';
    const teacherId = this.auth.user?._id ?? '';

    const { questions: generated, failedCount } =
      await this.aiService.generateQuestions(
        {
          topicId,
          materialIds,
          type: selectedType as QuestionType,
          language,
          difficulty,
          instructions: instructions || undefined,
          numberOfAlternatives: this.IsMultipleChoice()
            ? numberOfAlternatives
            : undefined,
        },
        numberOfQuestions,
      );

    if (!generated.length) {
      throw new Error('Nessuna domanda generata con successo.');
    }

    this.PartialGenerationWarning.set(failedCount);
    this.ReviewQuestions.set(
      generated.map((q) =>
        this.toReviewQuestion(q, topicId, subjectId, teacherId),
      ),
    );
    this.ReviewMode.set(true);
    this.IsGenerating.set(false);
  }

  private async submitMaterialGeneration(): Promise<void> {
    const { selectedType, numberOfSlides, format, language, instructions } =
      this.genForm.value;

    const materialIds = [...this.materialiSelector.selectedMaterialIds()];

    const material = await this.aiService.generateMaterial({
      type: selectedType as MaterialType,
      materialIds,
      numberOfSlides: this.IsSlides() ? numberOfSlides : undefined,
      format: this.IsSlides() ? format : undefined,
      additionalInstructions: instructions || undefined,
      language: language,
    });

    this.GeneratedMaterial.set(material);
    this.GenerationSuccess.set(true);
  }

  onReturnToMaterials(): void {
    const generated = this.GeneratedMaterial();
    if (generated?._id) {
      this.materialiFacade.highlightedItemId.set(generated._id);
    }
    this.IsGenerating.set(false);
    this.GenerationSuccess.set(false);
    this.GeneratedMaterial.set(null);
    this.navigateToResources();
  }

  navigateToResources(): void {
    this.modalService.dismissAll();
    if (this.activeOffcanvas) {
      this.activeOffcanvas.close();
    }
    this.router.navigate(['/t/risorse']);
  }

  toggleQuestion(tempId: string): void {
    this.ReviewQuestions.update((list) =>
      list.map((q) =>
        q.TempId === tempId ? { ...q, Selected: !q.Selected } : q,
      ),
    );
  }

  toggleAll(): void {
    const next = !this.AllSelected();
    this.ReviewQuestions.update((list) =>
      list.map((q) => ({ ...q, Selected: next })),
    );
  }

  onConfirmSelection(): void {
    const selected = this.ReviewQuestions().filter((q) => q.Selected);
    if (!selected.length) return;

    this.IsSaving.set(true);
    const payloads = selected.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...payload } = q.data; // strip local TempId — let MongoDB generate the real _id
      return payload as QuestionInterface;
    });

    this.questionsService.createQuestionsBatch(payloads).subscribe({
      next: (response) => {
        const questionsWithPoints: QuestionWithPoints[] = response.questions.map((q) => ({
          ...q,
          points: 1,
        }));
        this.IsSaving.set(false);
        if (this.IsOffcanvasMode()) {
          this.feedbackService.showFeedback(
            `${questionsWithPoints.length} ${questionsWithPoints.length === 1 ? 'domanda aggiunta' : 'domande aggiunte'} al test`,
            true,
          );
          this.activeOffcanvas?.close(questionsWithPoints);
        } else {
          this.feedbackService.showFeedback(
            `${questionsWithPoints.length} ${questionsWithPoints.length === 1 ? 'domanda salvata' : 'domande salvate'} nella banca domande`,
            true,
          );
          this.onBackToForm();
        }
      },
      error: () => {
        this.IsSaving.set(false);
        this.feedbackService.showFeedback(
          'Errore durante il salvataggio delle domande',
          false,
        );
      },
    });
  }

  onBackToForm(): void {
    this.ReviewMode.set(false);
    this.ReviewQuestions.set([]);
    this.PartialGenerationWarning.set(0);
  }

  private toReviewQuestion(
    q: GeneratedQuestion,
    formTopicId: string,
    subjectId: string,
    teacherId: string,
  ): ReviewQuestion {
    const tempId = crypto.randomUUID();
    const difficulty = this.genForm.controls['difficulty']
      .value as QuestionDifficulty;
    const resolvedTopicId = q.topicId || formTopicId;
    const data: QuestionInterface = {
      _id: tempId,
      text: q.text,
      type: q.type,
      explanation: q.explanation,
      difficulty,
      options: q.options,
      correctAnswer: q.correctAnswer,
      policy: 'private',
      topicId: resolvedTopicId,
      subjectId,
      teacherId,
    };
    return { TempId: tempId, data, Selected: true };
  }
}
