import { Component, effect, input, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { TopicsService } from '../../services/topics-service';
import { Materia } from '../../services/materia';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';
import { TypeSelector, TypeOption } from '../type-selector/type-selector';
import {
  QUESTION_TYPE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from '../../types/question.types';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-gen-ai-contents',
  imports: [
    FontAwesomeModule,
    MaterialiSelector,
    TypeSelector,
    ReactiveFormsModule,
  ],
  templateUrl: './gen-ai-contents.html',
  styleUrl: './gen-ai-contents.scss',
})
export class GenAiContents {
  type = input<'questions' | 'materials'>('materials');
  SparklesIcon = faSparkles;

  types = signal<TypeOption[]>([]);
  selectedType = signal<string>('');
  topicsSelected = signal<string[]>([]);

  constructor(
    public topicService: TopicsService,
    public materiaService: Materia,
  ) {}

  genForm: FormGroup = new FormGroup({
    selectedType: new FormControl('', [Validators.required]),
    type: new FormControl(this.type()),
    prompt: new FormControl(''),
    topics: new FormControl([]),
    numberOfQuestions: new FormControl(5, [
      Validators.required,
      Validators.min(1),
      Validators.max(20),
    ]),
  });

  ngOnInit() {
    if (this.type() === 'materials') {
      this.types.set(MATERIAL_TYPE_OPTIONS);
    } else {
      this.types.set(QUESTION_TYPE_OPTIONS);
    }
    this.selectedType.set(this.types()[0].value);
    this.genForm.controls['selectedType'].setValue(this.selectedType());
    this.genForm.controls['type'].setValue(this.type());
  }

  onToggleTopic(topic: string) {
    const currentTopics = this.topicsSelected();
    const index = currentTopics.indexOf(topic);
    if (index > -1) {
      this.topicsSelected.set(currentTopics.filter((t) => t !== topic));
    } else {
      this.topicsSelected.set([...currentTopics, topic]);
    }
    this.genForm.controls['topics'].setValue(this.topicsSelected());
  }

  isTopicSelected(topic: string): boolean {
    return this.topicsSelected().includes(topic);
  }

  getSelectedTypeName(): string {
    const selected = this.types().find((t) => t.value === this.selectedType());
    return selected?.label || '';
  }

  onSubmit() {
    if (this.genForm.invalid) {
      this.genForm.markAllAsTouched();
      return;
    }

    const formValue = this.genForm.value;
    console.log('Form submitted:', formValue);

    // TODO: Implementare la chiamata al servizio di generazione AI
    // Esempio:
    // this.aiService.generateContent(formValue).subscribe({
    //   next: (result) => console.log('Content generated:', result),
    //   error: (error) => console.error('Generation error:', error)
    // });
  }
}
