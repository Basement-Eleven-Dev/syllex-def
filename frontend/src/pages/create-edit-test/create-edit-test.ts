import { Component, OnInit, ViewChild, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faInfinity,
  faKey,
  faPenRuler,
  faSave,
  faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import { QuestionsDroppableList } from '../../components/questions-droppable-list/questions-droppable-list';
import { SearchQuestions } from '../../components/search-questions/search-questions';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { ClassiService } from '../../services/classi-service';
import { BackTo } from '../../components/back-to/back-to';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Materia } from '../../services/materia';
import { TestsService, TestInterface } from '../../services/tests-service';
import { QuestionInterface } from '../../services/questions';
import { FeedbackService } from '../../services/feedback-service';

@Component({
  selector: 'app-create-edit-test',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SearchQuestions,
    QuestionsDroppableList,
    ClassSelector,
    BackTo,
  ],
  templateUrl: './create-edit-test.html',
  styleUrl: './create-edit-test.scss',
})
export class CreateEditTest implements OnInit {
  InfinityIcon = faInfinity;
  GenPasswordIcon = faKey;
  DraftIcon = faPenRuler;
  SaveIcon = faSave;
  SparklesIcon = faSparkles;

  @ViewChild(QuestionsDroppableList)
  questionsComponent!: QuestionsDroppableList;

  testId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  questionsToLoad = signal<
    { questionId: string; points: number }[] | undefined
  >(undefined);

  testForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    availableFrom: new FormControl(''),
    availableTo: new FormControl(''),
    classes: new FormControl([]),
    password: new FormControl(''),
    requiredScore: new FormControl(0, [Validators.min(1)]),
    time: new FormControl(0),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public classiService: ClassiService,
    private offcanvasService: NgbOffcanvas,
    public materiaService: Materia,
    private testsService: TestsService,
    private feedbackService: FeedbackService,
  ) {}

  ngOnInit() {
    // Check se siamo in modalità edit
    this.route.params.subscribe((params) => {
      const testId = params['testId'];
      if (testId) {
        this.testId.set(testId);
        this.isEditMode.set(true);
        this.loadTest(testId);
      }
    });

    // Pre-seleziona la classe dal query param 'assign'
    this.route.queryParams.subscribe((params) => {
      const assignClassId = params['assign'];
      if (assignClassId && !this.isEditMode()) {
        this.testForm.get('classes')?.setValue([assignClassId]);
      }
    });
  }

  loadTest(testId: string): void {
    this.isLoading.set(true);
    this.testsService.getTestById(testId).subscribe({
      next: (response) => {
        const test = response.test;

        // Popola il form con i dati del test
        this.testForm.patchValue({
          title: test.name,
          availableFrom: test.availableFrom
            ? this.formatDateForInput(test.availableFrom)
            : '',
          availableTo: test.availableTo
            ? this.formatDateForInput(test.availableTo)
            : '',
          classes: test.classIds || [],
          password: test.password || '',
          requiredScore: test.fitScore || 0,
          time: test.timeLimit !== undefined ? test.timeLimit : null,
        });

        // Carica le domande nel componente questions-droppable-list
        if (test.questions && test.questions.length > 0) {
          this.loadQuestionsForTest(test.questions);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Errore durante il caricamento del test:', error);
        alert('Impossibile caricare il test');
        this.router.navigate(['/t/tests']);
        this.isLoading.set(false);
      },
    });
  }

  loadQuestionsForTest(
    questions: { questionId: string; points: number }[],
  ): void {
    this.questionsToLoad.set(questions);
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get assignedClasses() {
    return this.testForm.get('classes')?.value || [];
  }

  get time() {
    return this.testForm.get('time')?.value;
  }

  get maxScore(): number {
    if (!this.questionsComponent?.selectedQuestions) return 0;
    const questionCardsArray =
      this.questionsComponent.questionCards?.toArray() || [];
    return this.questionsComponent.selectedQuestions.reduce(
      (total, q, index) => {
        return total + (questionCardsArray[index]?.points || 1);
      },
      0,
    );
  }

  get canPublish(): boolean {
    const form = this.testForm.value;
    return !!(
      form.title &&
      form.availableFrom &&
      form.classes?.length > 0 &&
      this.questionsComponent?.selectedQuestions?.length > 0 &&
      form.requiredScore > 0 &&
      form.requiredScore <= this.maxScore
    );
  }

  get canSaveDraft(): boolean {
    return !!this.testForm.value.title;
  }

  onClassesChange(classIds: string[]): void {
    this.testForm.get('classes')?.setValue(classIds);
  }

  onGeneratePassword() {
    this.testForm.patchValue({
      password: Math.random().toString(36).slice(-8),
    });
  }

  onToggleUnlimitedTime() {
    const timeControl = this.testForm.get('time');
    if (this.time !== null) {
      timeControl?.setValue(null);
      timeControl?.disable();
    } else {
      timeControl?.setValue(0);
      timeControl?.enable();
    }
  }

  onSaveTest(asDraft: boolean = false) {
    const formValue = this.testForm.value;
    const selectedSubject = this.materiaService.materiaSelected();

    if (!selectedSubject) return;

    const questionsWithPoints = this.questionsComponent.selectedQuestions.map(
      (q, index) => {
        const questionCardsArray =
          this.questionsComponent.questionCards?.toArray() || [];
        return {
          questionId: q._id,
          points: questionCardsArray[index]?.points || 1,
        };
      },
    );

    const testData: TestInterface = {
      name: formValue.title,
      questions: questionsWithPoints,
      fitScore: formValue.requiredScore || 0,
      status: asDraft ? 'bozza' : 'pubblicato',
      subjectId: selectedSubject._id,
      classIds: formValue.classes || [],
    };

    if (formValue.availableFrom) {
      testData.availableFrom = new Date(formValue.availableFrom);
    }

    if (formValue.availableTo) {
      testData.availableTo = new Date(formValue.availableTo);
    }

    if (formValue.password?.trim()) {
      testData.password = formValue.password.trim();
    }

    if (formValue.time > 0) {
      testData.timeLimit = formValue.time;
    }

    this.isLoading.set(true);

    const request = this.isEditMode()
      ? this.testsService.editTest(this.testId()!, testData)
      : this.testsService.createTest(testData);

    request.subscribe({
      next: (response) => {
        console.log('Test salvato con successo:', response);
        this.feedbackService.showFeedback(
          `Test ${this.isEditMode() ? 'aggiornato' : 'creato'} con successo!`,
          true,
        );
        this.router.navigate(['/t/tests']);
      },
      error: (error) => {
        console.error('Errore durante il salvataggio del test:', error);
        this.feedbackService.showFeedback(
          'Errore durante il salvataggio del test',
          false,
        );
        this.isLoading.set(false);
      },
    });
  }

  onRequestAIGeneration() {
    const offcanvasRef = this.offcanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
    });
    offcanvasRef.componentInstance.type = 'questions';
  }
}
