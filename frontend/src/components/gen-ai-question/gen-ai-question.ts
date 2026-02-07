import { Component, input, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMarker,
  faPlus,
  faRobot,
  faSparkles,
  faSpellCheck,
  faSpinnerThird,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import {
  QuestionType,
  QUESTION_TYPE_OPTIONS,
} from '../../types/question.types';
import { TitleCasePipe } from '@angular/common';
import { AiService } from '../../services/ai-service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';
import { TypeSelector } from '../type-selector/type-selector';
import { Materia } from '../../services/materia';

@Component({
  selector: 'app-gen-ai-question',
  imports: [
    FontAwesomeModule,
    TypeSelector,
    TitleCasePipe,
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

  genAiQuestionForm: FormGroup = new FormGroup({
    type: new FormControl('scelta multipla'),
    topic: new FormControl(''),
    details: new FormControl(''),
    materials: new FormControl([]),
    attachedFile: new FormControl(null),
  });

  constructor(
    public offcanvas: NgbOffcanvas,
    private aiService: AiService,
    public materiaService: Materia,
  ) {}

  ngOnInit() {
    const topicValue = this.topic();
    if (topicValue) {
      this.genAiQuestionForm.patchValue({ topic: topicValue });
    }
  }

  onSelectQuestionType(value: string) {
    this.selectedType.set(value);
    this.genAiQuestionForm.patchValue({ type: value });
  }

  attachedFileName: string | null = null;
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      // Gestisci il file selezionato (ad esempio, caricalo o visualizzalo)
      console.log('File selezionato:', file);
      this.attachedFileName = file.name;
      this.genAiQuestionForm.patchValue({ attachedFile: file });
    }
  }

  loading: boolean = false;
  async onGenerate() {
    this.loading = true;
    const formValue = this.genAiQuestionForm.value;
    let res: any = await this.aiService.generateQuestion(formValue);
    console.log('Domanda generata:', res);
    res.type = formValue.type;
    this.loading = false;
    this.offcanvas.dismiss(res);
  }
}
