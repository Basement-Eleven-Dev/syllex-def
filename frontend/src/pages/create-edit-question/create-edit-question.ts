import { Component, computed, inject, signal } from '@angular/core';
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
  faGraduationCap,
  faImage,
  faSave,
  faSparkles,
  faSpinnerThird,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { MultipleChoiceOptions } from '../../components/multiple-choice-options/multiple-choice-options';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { GenAiQuestion } from '../../components/gen-ai-question/gen-ai-question';
import { QUESTION_TYPE_OPTIONS } from '../../types/question.types';
import { BackTo } from '../../components/back-to/back-to';
import { TypeSelector } from '../../components/type-selector/type-selector';
import { Materia } from '../../services/materia';
import { QuestionsService } from '../../services/questions';
import { FeedbackService } from '../../services/feedback-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    TypeSelector,
    FormsModule,
    ReactiveFormsModule,
    BackTo,
  ],
  templateUrl: './create-edit-question.html',
  styleUrl: './create-edit-question.scss',
})
export class CreateEditQuestion {
  // Services
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly offcanvasService = inject(NgbOffcanvas);
  readonly materiaService = inject(Materia);
  private readonly questionsService = inject(QuestionsService);
  private readonly feedbackService = inject(FeedbackService);

  // Icons
  readonly SparklesIcon = faSparkles;
  readonly ImageIcon = faImage;
  readonly UsersIcon = faUsers;
  readonly GraduationIcon = faGraduationCap;
  readonly SaveIcon = faSave;
  readonly SpinnerIcon = faSpinnerThird;

  // Data
  readonly QuestionTypeOptions = QUESTION_TYPE_OPTIONS;
  private readonly QuestionId = this.activatedRoute.snapshot.paramMap.get('id');
  private CurrentQuestionId = signal<string | null>(null);

  // UI State
  readonly SelectedQuestionType = signal<string>('scelta multipla');
  readonly SelectedPolicyType = signal<string>('public');
  readonly ImagePreview = signal<string | null>(null);
  readonly IsDragging = signal<boolean>(false);
  readonly IsLoading = signal<boolean>(false);
  private UploadedImageFile = signal<File | null>(null);

  // Computed
  readonly IsEditMode = computed(() => !!this.QuestionId);
  readonly PageTitle = computed(() =>
    this.IsEditMode() ? 'Modifica domanda' : 'Crea nuova domanda',
  );
  readonly PageDescription = computed(() =>
    this.IsEditMode()
      ? 'Modifica i dettagli della domanda selezionata.'
      : 'Compila il modulo sottostante per creare una nuova domanda.',
  );
  readonly SaveButtonLabel = computed(() =>
    this.IsEditMode() ? 'Aggiorna domanda' : 'Salva domanda',
  );

  readonly QuestionForm: FormGroup = new FormGroup({
    type: new FormControl('scelta multipla', Validators.required),
    text: new FormControl('', Validators.required),
    topicId: new FormControl('', Validators.required),
    explanation: new FormControl('', Validators.required),
    options: new FormControl([
      { label: 'Opzione 1', isCorrect: false },
      { label: 'Opzione 2', isCorrect: false },
      { label: 'Opzione 3', isCorrect: false },
      { label: 'Opzione 4', isCorrect: false },
      { label: 'Opzione 5', isCorrect: false },
    ]),
    policy: new FormControl('public'),
    correctAnswer: new FormControl(null),
  });

  constructor() {
    if (this.QuestionId) {
      this.loadQuestion(this.QuestionId);
    }
  }

  private loadQuestion(questionId: string): void {
    this.questionsService
      .loadQuestion(questionId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (question) => {
          this.CurrentQuestionId.set(question._id);
          this.populateFormWithQuestion(question);
        },
        error: (error) => {
          console.error('Error loading question:', error);
          this.feedbackService.showFeedback(
            'Errore durante il caricamento della domanda',
            false,
          );
        },
      });
  }

  private populateFormWithQuestion(question: any): void {
    this.QuestionForm.patchValue({
      type: question.type,
      text: question.text,
      topicId: question.topicId,
      explanation: question.explanation,
      policy: question.policy,
    });

    // Sincronizza i signal con i valori del form
    this.SelectedQuestionType.set(question.type);
    if (question.policy) {
      this.SelectedPolicyType.set(question.policy);
    }

    if (question.type === 'scelta multipla' && question.options) {
      this.QuestionForm.patchValue({ options: question.options });
    }

    if (
      question.type === 'vero falso' &&
      question.correctAnswer !== undefined
    ) {
      this.QuestionForm.patchValue({ correctAnswer: question.correctAnswer });
    }

    if (question.imageUrl) {
      this.ImagePreview.set(question.imageUrl);
    }
  }

  get questionOptions(): AnswerOption[] {
    return this.QuestionForm.get('options')?.value || [];
  }

  onOptionsChange(options: AnswerOption[]): void {
    this.QuestionForm.patchValue({ options });
  }

  onSelectCorrectAnswer(value: boolean): void {
    this.QuestionForm.patchValue({ correctAnswer: value });
  }

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

    serviceCall.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        const message = this.CurrentQuestionId()
          ? 'Domanda modificata con successo!'
          : 'Domanda salvata con successo!';
        this.feedbackService.showFeedback(message, true);
        this.IsLoading.set(false);
      },
      error: (error) => {
        console.error('Error saving question:', error);
        this.feedbackService.showFeedback(
          'Errore durante il salvataggio della domanda',
          false,
        );
        this.IsLoading.set(false);
      },
    });
  }

  private prepareQuestionData(): any {
    const questionData = { ...this.QuestionForm.value };

    // Clean unnecessary fields based on type
    if (questionData.type !== 'scelta multipla') {
      delete questionData.options;
    }
    if (questionData.type !== 'vero falso') {
      delete questionData.correctAnswer;
    }

    questionData.subjectId = this.materiaService.materiaSelected()?._id;

    // Preserve existing image URL if no new file
    if (this.ImagePreview() && !this.UploadedImageFile()) {
      questionData.imageUrl = this.ImagePreview();
    }

    return questionData;
  }

  onSelectQuestionType(type: string): void {
    this.SelectedQuestionType.set(type);
    this.QuestionForm.patchValue({ type });
  }

  onSelectPolicyType(policy: string): void {
    this.SelectedPolicyType.set(policy);
    this.QuestionForm.patchValue({ policy });
  }

  onRequestAIGeneration(): void {
    const offCanvasRef = this.offcanvasService.open(GenAiQuestion, {
      ariaLabelledBy: 'offcanvas-basic-title',
      position: 'end',
    });

    offCanvasRef.componentInstance.selectedType.set(
      this.SelectedQuestionType(),
    );

    offCanvasRef.dismissed.subscribe((result) => {
      if (result) {
        this.populateFormFromAI(result);
      }
    });
  }

  private populateFormFromAI(result: any): void {
    this.QuestionForm.patchValue({
      topicId: result.topic?._id || result.topic,
      type: result.type,
      text: result.content,
      explanation: result.explanation,
    });

    this.SelectedQuestionType.set(result.type);

    if (result.type === 'scelta multipla' && result.choices) {
      const options: AnswerOption[] = result.choices.map(
        (choice: AnswerOption) => ({
          label: choice.label,
          isCorrect: choice.isCorrect,
        }),
      );
      this.QuestionForm.patchValue({ options });
    }
  }

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

  private handleFile(file: File): void {
    if (!this.validateFile(file)) {
      return;
    }

    this.UploadedImageFile.set(file);
    this.createImagePreview(file);
  }

  private validateFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.feedbackService.showFeedback(
        'Per favore carica un file immagine valido',
        false,
      );
      return false;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      this.feedbackService.showFeedback(
        'Il file è troppo grande. Dimensione massima: 5MB',
        false,
      );
      return false;
    }

    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.ImagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.ImagePreview.set(null);
    this.UploadedImageFile.set(null);
  }
}
