import { Component, Input } from '@angular/core';
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
import { QuestionTypeSelectors } from '../question-type-selectors/question-type-selectors';
import { TitleCasePipe } from '@angular/common';
import { AiService } from '../../services/ai-service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TopicsService } from '../../services/topics-service';

@Component({
  selector: 'app-gen-ai-question',
  imports: [
    FontAwesomeModule,
    QuestionTypeSelectors,
    TitleCasePipe,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './gen-ai-question.html',
  styleUrl: './gen-ai-question.scss',
})
export class GenAiQuestion {
  RobotIcon = faRobot;
  SpinnerIcon = faSpinnerThird;

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
    public topicsService: TopicsService,
  ) {}
  @Input() selectedType: 'scelta multipla' | 'vero falso' | 'risposta aperta' =
    'scelta multipla';
  @Input() topic: string = '';
  @Input() difficulty: 'facile' | 'media' | 'difficile' = 'media';
  @Input() topics: string[] = [];
  @Input() topicSelected: string = '';
  @Input() questionTypes: {
    label: string;
    icon: any;
    value: 'scelta multipla' | 'vero falso' | 'risposta aperta';
  }[] = [];

  ngOnInit() {
    console.log('Topic input:', this.topic);
    if (this.topic) {
      this.genAiQuestionForm.patchValue({ topic: this.topic });
    }
  }

  MultipleChoiceIcon = faSpellCheck;
  TrueFalseIcon = faPlus;
  OpenAnswerIcon = faMarker;
  SparklesIcon = faSparkles;

  onSelectQuestionType(
    value: 'scelta multipla' | 'vero falso' | 'risposta aperta',
  ) {
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
