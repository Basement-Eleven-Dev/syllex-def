import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
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
  faArrowLeft,
  faArrowRight,
  faPresentationScreen,
  faAlignLeft,
  faList,
  faChartDiagram,
} from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { trigger, transition, style, animate } from '@angular/animations';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import { AiOverlay } from '../../components/ai-overlay/ai-overlay';
import { SyllexCard } from '../../components/UI/syllex-card/syllex-card';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexStepper } from '../../components/UI/syllex-stepper/syllex-stepper';
import { AiService } from '../../../services/ai-service';
import { FeedbackService } from '../../../services/feedback-service';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { Materia } from '../../../services/materia';
import {
  MaterialType,
} from '../../../types/question.types';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SyllexErrorModalComponent } from '../../../directives/syllex-error-modal.component';
import { MaterialiFacadeService } from '../../../services/materiali/materiali-facade.service';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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

@Component({
  selector: 'app-laboratorio-ai',
  standalone: true,
  imports: [
    FontAwesomeModule,
    RouterModule,
    ReactiveFormsModule,
    MaterialiSelector,
    AiOverlay,
    SyllexCard,
    SyllexPageHeader,
    SyllexStepper,
    TourAnchorNgBootstrapDirective,
    SyllexButton,
    TranslocoDirective,
    TranslocoPipe,
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
  private readonly modalService = inject(NgbModal);
  private readonly materialiFacade = inject(MaterialiFacadeService);
  private readonly translocoService = inject(TranslocoService);

  // Si incrementa quando le traduzioni del lang attivo vengono caricate/cambiate.
  // Le computed sotto lo leggono per RICALCOLARSI a load avvenuto: altrimenti, se
  // valutate prima del caricamento, "congelerebbero" le chiavi grezze.
  private readonly i18nVersion = signal(0);

  constructor() {
    this.translocoService.events$
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (e.type === 'translationLoadSuccess') {
          this.i18nVersion.update((n) => n + 1);
        }
      });
  }

  /**
   * Lettura traduzione ASYNC-SAFE: attende il caricamento del file di lingua e
   * restituisce sempre il testo tradotto (mai la chiave grezza). Da usare quando
   * il valore finisce nel form/nel prompt inviato al backend.
   */
  private translate(key: string): Promise<string> {
    return firstValueFrom(this.translocoService.selectTranslate(key));
  }

  // Icons
  readonly QuestionsIcon = faCheckDouble;
  readonly MaterialsIcon = faBooks;
  readonly SparklesIcon = faSparkles;
  readonly SpinnerIcon = faSpinnerThird;
  readonly ChevronLeftIcon = faChevronLeft;
  readonly ChevronRightIcon = faChevronRight;
  readonly CheckIcon = faCheck;
  readonly ArrowLeftIcon = faArrowLeft;
  readonly ArrowRightIcon = faArrowRight;

  // Options
  readonly MaterialTypes = computed(() => {
    this.i18nVersion();
    return [
    {
      label: this.translocoService.translate('laboratorio_ai.types.slides.label'),
      description: this.translocoService.translate('laboratorio_ai.types.slides.desc'),
      icon: faPresentationScreen,
      value: 'slides',
    },
    {
      label: this.translocoService.translate('laboratorio_ai.types.riassunto.label'),
      description: this.translocoService.translate('laboratorio_ai.types.riassunto.desc'),
      icon: faAlignLeft,
      value: 'riassunto',
    },
    {
      label: this.translocoService.translate('laboratorio_ai.types.glossario.label'),
      description: this.translocoService.translate('laboratorio_ai.types.glossario.desc'),
      icon: faList,
      value: 'glossario',
    },
    {
      label: this.translocoService.translate('laboratorio_ai.types.mappe-concettuali.label'),
      description: this.translocoService.translate('laboratorio_ai.types.mappe-concettuali.desc'),
      icon: faChartDiagram,
      value: 'mappe-concettuali',
    },
    ];
  });

  readonly LanguageOptions = [
    { value: 'italiano', label: 'Italiano' },
    { value: 'inglese', label: 'English' },
    { value: 'spagnolo', label: 'Español' },
    { value: 'francese', label: 'Français' },
    { value: 'tedesco', label: 'Deutsch' },
  ];

  readonly StyleOptions = computed<StyleOption[]>(() => {
    this.i18nVersion();
    return [
    {
      value: 'schematica',
      label: this.translocoService.translate('laboratorio_ai.style_options.schematica.label'),
      description: this.translocoService.translate('laboratorio_ai.style_options.schematica.desc'),
      icon: faListCheck,
    },
    {
      value: 'bilanciata',
      label: this.translocoService.translate('laboratorio_ai.style_options.bilanciata.label'),
      description: this.translocoService.translate('laboratorio_ai.style_options.bilanciata.desc'),
      icon: faBarsStaggered,
      recommended: true,
    },
    {
      value: 'descrittiva',
      label: this.translocoService.translate('laboratorio_ai.style_options.descrittiva.label'),
      description: this.translocoService.translate('laboratorio_ai.style_options.descrittiva.desc'),
      icon: faFileLines,
    },
    ];
  });

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
    this.i18nVersion();
    if (this.IsSlides()) {
      return [
        { n: 1, label: this.translocoService.translate('laboratorio_ai.step_type') },
        { n: 2, label: this.translocoService.translate('laboratorio_ai.step_file') },
        { n: 3, label: this.translocoService.translate('laboratorio_ai.step_style') },
        { n: 4, label: this.translocoService.translate('laboratorio_ai.step_generate') },
      ];
    }
    return [
      { n: 1, label: this.translocoService.translate('laboratorio_ai.step_type') },
      { n: 2, label: this.translocoService.translate('laboratorio_ai.step_file') },
      { n: 3, label: this.translocoService.translate('laboratorio_ai.step_custom') },
    ];
  });

  readonly SelectedMaterialTypeName = computed(
    () =>
      this.MaterialTypes().find((t) => t.value === this.SelectedMaterialType())
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
          this.translate(`laboratorio_ai.style_prefills.${style}`).then((v) =>
            this.genForm.controls['instructions'].setValue(v),
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
      this.translate('laboratorio_ai.style_prefills.bilanciata').then((v) =>
        this.genForm.controls['instructions'].setValue(v),
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
    this.translate(`laboratorio_ai.style_prefills.${value}`).then((v) =>
      this.genForm.controls['instructions'].setValue(v),
    );
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
          ? await this.translate(`laboratorio_ai.style_instructions.${slideStyle}`)
          : '';
        const parts = [topicInstruction, styleInstruction, instructions].filter(
          Boolean,
        );
        additionalInstructions = parts.join(' | ') || undefined;
      } else {
        const parts = [topicInstruction, instructions].filter(Boolean);
        additionalInstructions = parts.join(' | ') || undefined;
      }

      const result = await this.aiService.generateMaterial({
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
      // Memorizza l'ID nel facade per evidenziarlo nella pagina Risorse
      if (result?._id) {
        this.materialiFacade.setNewlyCreatedHighlight(result._id);
      }
    } catch (error) {
      const errMsg = this.aiService.extractErrorMessage(error);
      if (errMsg.toLowerCase().includes('non contiene testo sufficiente')) {
        const modalRef = this.modalService.open(SyllexErrorModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        });
        modalRef.componentInstance.title = this.translocoService.translate('laboratorio_ai.error_modal_title');
        modalRef.componentInstance.message = errMsg;
        modalRef.componentInstance.buttonText = this.translocoService.translate('laboratorio_ai.error_modal_btn');
      } else {
        this.feedbackService.showFeedback(errMsg, false);
      }
      this.IsGenerating.set(false);
    }
  }

  onReturnToResources(): void {
    this.IsGenerating.set(false);
    this.GenerationSuccess.set(false);
    this.router.navigate(['/t/risorse']);
  }
}
