import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faGraduationCap,
  faImage,
  faMarker,
  faPlus,
  faRobot,
  faSave,
  faSparkles,
  faSpellCheck,
  faSpinnerThird,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { MultipleChoiceOptions } from '../../components/multiple-choice-options/multiple-choice-options';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { GenAiQuestion } from '../../components/gen-ai-question/gen-ai-question';
import {
  QuestionType,
  QuestionTypeSelectors,
} from '../../components/question-type-selectors/question-type-selectors';
import { JsonPipe } from '@angular/common';
import { TopicsService } from '../../services/topics-service';

export interface AnswerOption {
  label: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-create-edit-question',
  imports: [
    RouterModule,
    FontAwesomeModule,
    MultipleChoiceOptions,
    GenAiQuestion,
    QuestionTypeSelectors,
    FormsModule,
    ReactiveFormsModule,
    JsonPipe,
  ],
  templateUrl: './create-edit-question.html',
  styleUrl: './create-edit-question.scss',
})
export class CreateEditQuestion {
  questionId: string | null = null;

  SparklesIcon = faSparkles;
  ImageIcon = faImage;
  UsersIcon = faUsers;
  GraduationIcon = faGraduationCap;
  SaveIcon = faSave;
  SpinnerIcon = faSpinnerThird;

  constructor(
    private activatedRoute: ActivatedRoute,
    public topicsService: TopicsService,
  ) {
    this.questionId = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.onRequestAIGeneration();
  }

  questionForm: FormGroup = new FormGroup({
    type: new FormControl('scelta multipla', Validators.required),
    text: new FormControl('', Validators.required),
    topic: new FormControl('', Validators.required),
    explanation: new FormControl('', Validators.required),
    image: new FormControl(null),
    options: new FormControl([
      { label: 'Opzione 1', isCorrect: false },
      { label: 'Opzione 2', isCorrect: false },
      { label: 'Opzione 3', isCorrect: false },
      { label: 'Opzione 4', isCorrect: false },
      { label: 'Opzione 5', isCorrect: false },
    ]),
    policy: new FormControl('public'),
  });

  get questionOptions(): AnswerOption[] {
    return this.questionForm.get('options')?.value || [];
  }

  onOptionsChange(options: AnswerOption[]): void {
    this.questionForm.patchValue({ options });
  }

  loading: boolean = false;
  onSaveQuestion(): void {
    const questionData = this.questionForm.value;
    if (questionData.type !== 'scelta multipla') {
      delete questionData.options;
    }
    console.log('Salvataggio domanda:', questionData);
    // Logica per salvare la domanda (chiamata al servizio, ecc.)
  }

  imagePreview: string | null = null;
  isDragging = false;

  onSelectQuestionType(type: QuestionType): void {
    this.questionForm.patchValue({ type });
  }

  onSelectPolicyType(policy: string): void {
    this.questionForm.patchValue({ policy });
  }

  get selectedQuestionType(): QuestionType {
    return this.questionForm.get('type')!.value;
  }

  get selectedPolicyType(): string {
    return this.questionForm.get('policy')?.value;
  }

  private offcanvasService = inject(NgbOffcanvas);
  onRequestAIGeneration(): void {
    let offCanvasRef = this.offcanvasService.open(GenAiQuestion, {
      ariaLabelledBy: 'offcanvas-basic-title',
      position: 'end',
    });

    offCanvasRef.componentInstance.selectedType = this.selectedQuestionType;
    offCanvasRef.dismissed.subscribe((result) => {
      if (result) {
        console.log('Risultato generazione AI:', result);
        // Popola il form con i dati generati
        this.questionForm.patchValue({
          topic: result.topic,
          type: result.type,
          text: result.content,
          explanation: result.explanation,
        });
        if (result.type === 'scelta multipla' && result.choices) {
          const options: AnswerOption[] = result.choices.map(
            (choice: AnswerOption) => ({
              label: choice.label,
              isCorrect: choice.isCorrect,
            }),
          );
          this.questionForm.patchValue({ options });
        }
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Verifica che il file sia un'immagine
    if (!file.type.startsWith('image/')) {
      alert('Per favore carica un file immagine valido');
      return;
    }

    // Verifica dimensione file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Il file è troppo grande. Dimensione massima: 5MB');
      return;
    }

    // Salva il file nel form
    this.questionForm.patchValue({ image: file });

    // Crea preview dell'immagine
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview = null;
    this.questionForm.patchValue({ image: null });
  }
}
