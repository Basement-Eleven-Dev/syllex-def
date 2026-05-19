import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faBarsStaggered,
  faBooks,
  faCheck,
  faCheckDouble,
  faChevronLeft,
  faChevronRight,
  faFileLines,
  faListCheck,
  faSparkles,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { trigger, transition, style, animate } from '@angular/animations';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import { AiOverlay } from '../../components/ai-overlay/ai-overlay';
import { SyllexCard } from '../../components/UI/syllex-card/syllex-card';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexSelectInput } from '../../components/UI/syllex-select-input/syllex-select-input';
import { SyllexStepper } from '../../components/UI/syllex-stepper/syllex-stepper';
import { AiService } from '../../../services/ai-service';
import { FeedbackService } from '../../../services/feedback-service';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { Materia } from '../../../services/materia';
import {
  MATERIAL_TYPE_OPTIONS,
  MaterialType,
} from '../../../types/question.types';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';

interface StepDef {
  n: number;
  label: string;
}

type SlideStyle = 'schematica' | 'bilanciata' | 'descrittiva';

interface StyleOption {
  value: SlideStyle;
  label: string;
  description: string;
  icon: IconDefinition;
  recommended?: boolean;
}

const STYLE_INSTRUCTION_MAP: Record<SlideStyle, string> = {
  schematica:
    'Le slide devono essere schematiche e telegrafiche: massimo 3 punti brevi per slide, frasi nominali, nessuna spiegazione estesa.',
  bilanciata: '',
  descrittiva:
    'Le slide devono essere descrittive e approfondite: ogni punto deve contenere spiegazioni complete e contestualizzate, con esempi dove utile.',
};

const STYLE_PREFILL_MAP: Record<SlideStyle, string> = {
  schematica:
    'Rendi le slide estremamente sintetiche: massimo 3 punti brevissimi per slide, usa frasi nominali, elimina ogni spiegazione ridondante. La chiarezza conta più della completezza.',
  bilanciata:
    'Struttura ogni slide con un titolo chiaro e 3-4 punti ben distinti. Ogni punto deve essere autonomo e comprensibile, senza essere né troppo lungo né troppo telegrafico. Adatta il linguaggio al livello della classe.',
  descrittiva:
    'Sviluppa ogni concetto in modo approfondito: ogni punto deve includere una spiegazione contestualizzata e, dove possibile, un esempio concreto o un collegamento con la realtà. Privilegia la comprensione profonda rispetto alla sintesi.',
};

@Component({
  selector: 'app-laboratorio-ai',
  imports: [
    FontAwesomeModule,
    RouterModule,
    ReactiveFormsModule,
    MaterialiSelector,
    AiOverlay,
    SyllexCard,
    SyllexPageHeader,
    SyllexSelectInput,
    SyllexStepper,
    TourAnchorNgBootstrapDirective,
    SyllexButton,
  ],
  templateUrl: './laboratorio-ai.html',
  styleUrl: './laboratorio-ai.scss',
  animations: [
    trigger('stepIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(16px)' }),
        animate(
          '220ms 80ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
      transition(':leave', [
        style({ position: 'absolute', top: 0, left: 0, right: 0, opacity: 1 }),
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translateX(-12px)' }),
        ),
      ]),
    ]),
  ],
})
export class LaboratorioAi {
  @ViewChild(MaterialiSelector)
  private materialiSelectorRef?: MaterialiSelector;

  private readonly router = inject(Router);
  private readonly aiService = inject(AiService);
  private readonly feedbackService = inject(FeedbackService);
  readonly materiaService = inject(Materia);

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
  readonly LanguageOptions = [
    { value: 'italiano', label: 'Italiano' },
    { value: 'inglese', label: 'English' },
    { value: 'spagnolo', label: 'Español' },
    { value: 'francese', label: 'Français' },
    { value: 'tedesco', label: 'Deutsch' },
  ];

  readonly StyleOptions: StyleOption[] = [
    {
      value: 'schematica',
      label: 'Schematica',
      description: 'Solo titoli e punti chiave, massima sintesi',
      icon: faListCheck,
    },
    {
      value: 'bilanciata',
      label: 'Bilanciata',
      description: 'Equilibrio tra sintesi e completezza',
      icon: faBarsStaggered,
      recommended: true,
    },
    {
      value: 'descrittiva',
      label: 'Descrittiva',
      description: 'Spiegazioni estese con esempi',
      icon: faFileLines,
    },
  ];

  // State
  readonly InitialChoice = signal<'materials' | null>(null);
  readonly CurrentStep = signal<number>(1);
  readonly SelectedMaterialType = signal<string>('');
  readonly IsGenerating = signal<boolean>(false);
  readonly GenerationSuccess = signal<boolean>(false);
  readonly SelectedMaterialIds = signal<string[]>([]);

  // Computed
  readonly IsSlides = computed(() => this.SelectedMaterialType() === 'slides');
  readonly MaxStep = computed(() => (this.IsSlides() ? 4 : 3));

  readonly StepDefs = computed<StepDef[]>(() => {
    if (this.IsSlides()) {
      return [
        { n: 1, label: 'Tipo' },
        { n: 2, label: 'File' },
        { n: 3, label: 'Stile' },
        { n: 4, label: 'Genera' },
      ];
    }
    return [
      { n: 1, label: 'Tipo' },
      { n: 2, label: 'File' },
      { n: 3, label: 'Genera' },
    ];
  });

  readonly SelectedMaterialTypeName = computed(
    () =>
      this.MaterialTypes.find((t) => t.value === this.SelectedMaterialType())
        ?.label ?? 'materiale',
  );

  readonly CanGoNext = computed(() => {
    const step = this.CurrentStep();
    if (step >= this.MaxStep()) return false;
    if (step === 1) return !!this.SelectedMaterialType();
    if (step === 2) return this.SelectedMaterialIds().length > 0;
    return true;
  });

  readonly ShowNextArrow = computed(() => this.CurrentStep() < this.MaxStep());

  // Form
  readonly genForm = new FormGroup({
    selectedType: new FormControl('', Validators.required),
    numberOfSlides: new FormControl(10, [
      Validators.min(3),
      Validators.max(30),
    ]),
    format: new FormControl<'pptx' | 'pdf'>('pdf'),
    language: new FormControl('italiano', Validators.required),
    instructions: new FormControl(''),
    slideStyle: new FormControl<SlideStyle>('bilanciata'),
    topicId: new FormControl<string>(''),
  });

  // ─── Navigation ──────────────────────────────────────

  goNext(): void {
    if (!this.CanGoNext()) return;
    if (this.CurrentStep() < this.MaxStep()) {
      const nextStep = this.CurrentStep() + 1;
      this.CurrentStep.set(nextStep);
      // When entering slide style step, always sync prefill to current style selection
      if (this.IsSlides() && nextStep === 3) {
        const style = this.genForm.controls['slideStyle'].value as SlideStyle;
        if (style) {
          this.genForm.controls['instructions'].setValue(
            STYLE_PREFILL_MAP[style],
          );
        }
      }
    }
  }

  goPrev(): void {
    if (this.CurrentStep() === 1) {
      this.InitialChoice.set(null);
      this.SelectedMaterialType.set('');
      this.genForm.controls['selectedType'].setValue('');
      return;
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

  // ─── Step 1 ───────────────────────────────────────────

  onSelectMaterialType(type: string): void {
    this.SelectedMaterialType.set(type);
    this.genForm.controls['selectedType'].setValue(type);
    // Reset instructions to type-appropriate default
    if (type === 'slides') {
      this.genForm.controls['instructions'].setValue(
        STYLE_PREFILL_MAP['bilanciata'],
      );
    } else {
      this.genForm.controls['instructions'].setValue('');
    }
    if (this.CurrentStep() === 1) {
      setTimeout(() => this.CurrentStep.set(2), 280);
    }
  }

  // ─── Material selection ───────────────────────────────

  onMaterialSelectionChange(materials: MaterialInterface[]): void {
    this.SelectedMaterialIds.set(materials.map((m) => m._id));
  }

  onDeselectAllMaterials(): void {
    this.materialiSelectorRef?.deselectAll();
  }

  // ─── Style preset ─────────────────────────────────────

  onStyleSelect(value: SlideStyle): void {
    this.genForm.controls['slideStyle'].setValue(value);
    this.genForm.controls['instructions'].setValue(STYLE_PREFILL_MAP[value]);
  }

  // ─── Generate ─────────────────────────────────────────

  async onGenerate(): Promise<void> {
    if (this.genForm.invalid) return;
    this.IsGenerating.set(true);
    try {
      const {
        selectedType,
        numberOfSlides,
        format,
        language,
        instructions,
        slideStyle,
        topicId,
      } = this.genForm.value;

      const topicName = topicId
        ? this.materiaService.getTopicName(topicId)
        : null;
      const topicInstruction = topicName
        ? `Focalizza il contenuto esclusivamente sull'argomento: "${topicName}".`
        : '';

      let additionalInstructions: string | undefined;
      if (this.IsSlides()) {
        const styleInstruction = slideStyle
          ? STYLE_INSTRUCTION_MAP[slideStyle]
          : '';
        const parts = [topicInstruction, styleInstruction, instructions].filter(
          Boolean,
        );
        additionalInstructions = parts.join(' | ') || undefined;
      } else {
        const parts = [topicInstruction, instructions].filter(Boolean);
        additionalInstructions = parts.join(' | ') || undefined;
      }

      await this.aiService.generateMaterial({
        type: selectedType as MaterialType,
        materialIds: this.SelectedMaterialIds(),
        numberOfSlides: this.IsSlides()
          ? (numberOfSlides ?? undefined)
          : undefined,
        format: this.IsSlides() ? (format as 'pptx' | 'pdf') : undefined,
        additionalInstructions,
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
