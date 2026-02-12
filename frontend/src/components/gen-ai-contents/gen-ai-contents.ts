import {
  Component,
  effect,
  Input,
  signal,
  Optional,
  OnInit,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons';
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
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';

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
export class GenAiContents implements OnInit {
  @Input() set type(value: 'questions' | 'materials') {
    this.typeSignal.set(value);
  }

  typeSignal = signal<'questions' | 'materials'>('materials');
  SparklesIcon = faSparkles;

  types = signal<TypeOption[]>([]);
  selectedType = signal<string>('');

  // Determina se siamo in modalità offcanvas
  isOffcanvasMode = signal<boolean>(false);

  constructor(
    public materiaService: Materia,
    @Optional() public activeOffcanvas?: NgbActiveOffcanvas,
  ) {
    // Siamo in modalità offcanvas se activeOffcanvas è disponibile
    this.isOffcanvasMode.set(!!activeOffcanvas);
  }

  genForm: FormGroup = new FormGroup({
    selectedType: new FormControl('', [Validators.required]),
    type: new FormControl(this.typeSignal()),
    prompt: new FormControl(''),
    topicId: new FormControl('', [Validators.required]),
    numberOfQuestions: new FormControl(5, [
      Validators.required,
      Validators.min(1),
      Validators.max(20),
    ]),
  });

  ngOnInit() {
    if (this.typeSignal() === 'materials') {
      this.types.set(MATERIAL_TYPE_OPTIONS);
    } else {
      this.types.set(QUESTION_TYPE_OPTIONS);
    }
    this.selectedType.set(this.types()[0].value);
    this.genForm.controls['selectedType'].setValue(this.selectedType());
    this.genForm.controls['type'].setValue(this.typeSignal());
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
