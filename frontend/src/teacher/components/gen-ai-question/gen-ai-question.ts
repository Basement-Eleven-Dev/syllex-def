import {
  Component,
  computed,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRobot,
  faSparkles,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { QUESTION_TYPE_OPTIONS } from '../../../types/question.types';
import { AiService } from '../../../services/ai-service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';
import { TypeSelector } from '../type-selector/type-selector';
import { Materia } from '../../../services/materia';

@Component({
  selector: 'app-gen-ai-question',
  imports: [
    FontAwesomeModule,
    TypeSelector,
    FormsModule,
    ReactiveFormsModule,
    MaterialiSelector,
  ],
  templateUrl: './gen-ai-question.html',
  styleUrl: './gen-ai-question.scss',
})
export class GenAiQuestion {
  RobotIcon = faRobot;
  SpinnerIcon = faSpinnerThird;
  SparklesIcon = faSparkles;

  questionTypeOptions = QUESTION_TYPE_OPTIONS;
  selectedType = signal<string>('scelta multipla');
  topic = input<string>('');
  IsLoading = signal<boolean>(false);

  @ViewChild(MaterialiSelector) materialiSelector!: MaterialiSelector;

  readonly offcanvas = inject(NgbOffcanvas);
  readonly aiService = inject(AiService);
  readonly materiaService = inject(Materia);

  IsMultipleChoice = computed(() => this.selectedType() === 'scelta multipla');

  genAiQuestionForm: FormGroup = new FormGroup({
    type: new FormControl('scelta multipla', Validators.required),
    topicId: new FormControl('', Validators.required),
    instructions: new FormControl(''),
    language: new FormControl('it', Validators.required),
    difficulty: new FormControl<1 | 2 | 3>(2, Validators.required),
    numberOfAlternatives: new FormControl(4),
  });

  ngOnInit(): void {
    const topicValue = this.topic();
    if (topicValue) {
      this.genAiQuestionForm.patchValue({ topicId: topicValue });
    }
  }

  onSelectQuestionType(value: string): void {
    this.selectedType.set(value);
    this.genAiQuestionForm.patchValue({ type: value });
  }

  async onGenerate(): Promise<void> {
    if (this.genAiQuestionForm.invalid) return;
    this.IsLoading.set(true);

    try {
      const {
        type,
        topicId,
        instructions,
        language,
        difficulty,
        numberOfAlternatives,
      } = this.genAiQuestionForm.value;

      const materialIds = [...this.materialiSelector.selectedMaterialIds()];

      const question = await this.aiService.generateQuestion({
        type,
        topicId,
        materialIds,
        instructions: instructions || undefined,
        language,
        difficulty,
        numberOfAlternatives: this.IsMultipleChoice()
          ? numberOfAlternatives
          : undefined,
      });

      // Adapter: map backend shape → populateFormFromAI shape
      this.offcanvas.dismiss({
        type: question.type,
        content: question.text,
        explanation: question.explanation,
        choices: question.options,
        correctAnswer: question.correctAnswer
      });
    } finally {
      this.IsLoading.set(false);
    }
  }
}
