import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBooks,
  faCheck,
  faCheckDouble,
  faChevronLeft,
  faChevronRight,
  faSparkles,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { trigger, transition, style, animate } from '@angular/animations';
import { TypeSelector } from '../../components/type-selector/type-selector';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import { AiOverlay } from '../../components/ai-overlay/ai-overlay';
import { SyllexCard } from '../../components/UI/syllex-card/syllex-card';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { AiService } from '../../../services/ai-service';
import { FeedbackService } from '../../../services/feedback-service';
import {
  MATERIAL_TYPE_OPTIONS,
  MaterialType,
} from '../../../types/question.types';

interface StepDef {
  n: number;
  label: string;
}

@Component({
  selector: 'app-laboratorio-ai',
  imports: [
    FontAwesomeModule,
    RouterModule,
    ReactiveFormsModule,
    TypeSelector,
    MaterialiSelector,
    AiOverlay,
    SyllexCard,
    SyllexPageHeader,
    TourAnchorNgBootstrapDirective,
  ],
  templateUrl: './laboratorio-ai.html',
  styleUrl: './laboratorio-ai.scss',
  animations: [
    trigger('stepIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '180ms ease-in',
          style({ opacity: 0, transform: 'translateX(-20px)' }),
        ),
      ]),
    ]),
  ],
})
export class LaboratorioAi {
  private readonly router = inject(Router);
  private readonly aiService = inject(AiService);
  private readonly feedbackService = inject(FeedbackService);

  @ViewChild(MaterialiSelector) private materialiSelector!: MaterialiSelector;

  // Icons
  readonly QuestionsIcon = faCheckDouble;
  readonly MaterialsIcon = faBooks;
  readonly SparklesIcon = faSparkles;
  readonly SpinnerIcon = faSpinnerThird;
  readonly ChevronLeftIcon = faChevronLeft;
  readonly ChevronRightIcon = faChevronRight;
  readonly CheckIcon = faCheck;

  // Options
  readonly MaterialTypes = MATERIAL_TYPE_OPTIONS;

  // State
  readonly InitialChoice = signal<'materials' | null>(null);
  readonly CurrentStep = signal<number>(1);
  readonly SelectedMaterialType = signal<string>('');
  readonly IsGenerating = signal<boolean>(false);
  readonly GenerationSuccess = signal<boolean>(false);

  readonly StepDefs: StepDef[] = [
    { n: 1, label: 'Tipo' },
    { n: 2, label: 'Genera' },
  ];

  // Computed
  readonly IsSlides = computed(() => this.SelectedMaterialType() === 'slides');

  readonly SelectedMaterialTypeName = computed(
    () =>
      this.MaterialTypes.find((t) => t.value === this.SelectedMaterialType())
        ?.label ?? 'materiale',
  );

  readonly CanGoNext = computed(
    () => this.CurrentStep() === 1 && !!this.SelectedMaterialType(),
  );

  readonly ShowNextArrow = computed(() => this.CurrentStep() === 1);

  // Form (step 3)
  readonly genForm = new FormGroup({
    selectedType: new FormControl('', Validators.required),
    numberOfSlides: new FormControl(10, [
      Validators.min(3),
      Validators.max(30),
    ]),
    format: new FormControl<'pptx' | 'pdf'>('pptx'),
    language: new FormControl('italiano', Validators.required),
    instructions: new FormControl(''),
  });

  // ─── Navigation ──────────────────────────────────────

  goNext(): void {
    if (!this.CanGoNext()) return;
    if (this.CurrentStep() < 2) this.CurrentStep.update((s) => s + 1);
  }

  goPrev(): void {
    if (this.CurrentStep() === 1) {
      // Back to pre-step card selection
      this.InitialChoice.set(null);
      this.SelectedMaterialType.set('');
      this.genForm.controls['selectedType'].setValue('');
      this.CurrentStep.set(1);
      return;
    }
    if (this.CurrentStep() === 2) {
      this.SelectedMaterialType.set('');
      this.genForm.controls['selectedType'].setValue('');
    }
    this.CurrentStep.update((s) => s - 1);
  }

  // ─── Pre-step: initial choice ────────────────────────

  onSelectInitialType(type: 'questions' | 'materials'): void {
    if (type === 'questions') {
      this.router.navigate(['/t/create-question']);
    } else {
      this.InitialChoice.set('materials');
      this.CurrentStep.set(1);
    }
  }

  // ─── Step 1: material type ────────────────────────────

  onSelectMaterialType(type: string): void {
    this.SelectedMaterialType.set(type);
    this.genForm.controls['selectedType'].setValue(type);
    if (this.CurrentStep() === 1) {
      setTimeout(() => this.CurrentStep.set(2), 280);
    }
  }

  // ─── Step 3: generate ─────────────────────────────────

  async onGenerate(): Promise<void> {
    if (this.genForm.invalid) return;
    this.IsGenerating.set(true);
    try {
      const { selectedType, numberOfSlides, format, language, instructions } =
        this.genForm.value;
      const materialIds = this.materialiSelector
        ? [...this.materialiSelector.selectedMaterialIds()]
        : [];

      await this.aiService.generateMaterial({
        type: selectedType as MaterialType,
        materialIds,
        numberOfSlides: this.IsSlides()
          ? (numberOfSlides ?? undefined)
          : undefined,
        format: this.IsSlides() ? (format as 'pptx' | 'pdf') : undefined,
        additionalInstructions: instructions || undefined,
        language: language ?? 'italiano',
      });

      this.GenerationSuccess.set(true);
    } catch {
      this.feedbackService.showFeedback(
        'Errore durante la generazione. Riprova.',
        false,
      );
      this.IsGenerating.set(false);
    }
  }

  onReturnToResources(): void {
    this.IsGenerating.set(false);
    this.GenerationSuccess.set(false);
    this.router.navigate(['/t/risorse']);
  }
}
