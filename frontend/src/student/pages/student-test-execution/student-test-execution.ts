import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  QuestionInterface,
  QuestionsService,
} from '../../../services/questions';
import {
  StudentTestInterface,
  StudentTestsService,
} from '../../../services/student-tests.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-test-execution',
  imports: [CommonModule, FormsModule],
  templateUrl: './student-test-execution.html',
  styleUrl: './student-test-execution.scss',
})
export class StudentTestExecution implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly questionsService = inject(QuestionsService);
  private readonly testsService = inject(StudentTestsService);
  private readonly router = inject(Router);

  readonly testId = this.route.snapshot.paramMap.get('testId')!;
  readonly test = signal<StudentTestInterface | null>(null);
  readonly questions = signal<QuestionInterface[]>([]);
  readonly answers = signal<Record<string, any>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loadTestAndQuestions();
  }

  loadTestAndQuestions() {
    this.loading.set(true);
    this.error.set(null);
    // 1. Load test info
    this.testsService.getAvailableTests().subscribe({
      next: (tests) => {
        const found = tests.find((t) => t._id === this.testId);
        if (!found) {
          this.error.set('Test non trovato');
          this.loading.set(false);
          return;
        }
        this.test.set(found);
        // 2. Load all questions for this test
        const questionIds =
          (found as any).questions?.map(
            (q: any) => q.questionId?.$oid || q.questionId || q._id,
          ) || [];
        if (!questionIds.length) {
          this.loading.set(false);
          return;
        }
        // Fetch all questions in parallel
        let loaded: QuestionInterface[] = [];
        let completed = 0;
        questionIds.forEach((qid: string) => {
          this.questionsService.loadQuestion(qid).subscribe({
            next: (q) => {
              loaded.push(q);
              completed++;
              if (completed === questionIds.length) {
                // Sort as in test.questions order
                loaded.sort(
                  (a, b) =>
                    questionIds.indexOf(a._id) - questionIds.indexOf(b._id),
                );
                this.questions.set(loaded);
                this.loading.set(false);
              }
            },
            error: () => {
              completed++;
              if (completed === questionIds.length) {
                loaded.sort(
                  (a, b) =>
                    questionIds.indexOf(a._id) - questionIds.indexOf(b._id),
                );
                this.questions.set(loaded);
                this.loading.set(false);
              }
            },
          });
        });
      },
      error: (err) => {
        this.error.set('Errore nel caricamento del test');
        this.loading.set(false);
      },
    });
  }

  selectOption(questionId: string, value: number | string) {
    this.answers.update((a) => ({ ...a, [questionId]: value }));
  }

  isSelected(questionId: string, optionIdx: number) {
    return this.answers()[questionId] === optionIdx;
  }

  getOpenAnswer(questionId: string): string {
    return this.answers()[questionId] ?? '';
  }

  submit() {
    const test = this.test();
    const questions = this.questions();
    if (!test || !questions.length) return;
    const firstQ = questions[0];
    const attempt = {
      testId: test._id,
      subjectId: (test as any).subjectId || firstQ.subjectId,
      teacherId: (test as any).teacherId || firstQ.teacherId,
      deliveredAt: new Date().toISOString(),

      questions: questions.map((q) => {
        const answerIdx = this.answers()[q._id];
        let answerLabel = null;
        let correctLabel = null;
        if (
          (q.type === 'scelta multipla' || q.type === 'vero falso') &&
          Array.isArray(q.options)
        ) {
          answerLabel =
            typeof answerIdx === 'number'
              ? (q.options[answerIdx]?.label ?? null)
              : null;
          const correctOpt = q.options.find((opt) => opt.isCorrect);
          correctLabel = correctOpt ? correctOpt.label : null;
        }
        return {
          _id: q._id,
          text: q.text,
          answer: q.type === 'risposta aperta' ? answerIdx : answerLabel,
          correct: q.type === 'risposta aperta' ? null : correctLabel,
        };
      }),
    };
    this.loading.set(true);
    this.testsService.submitTestAttempt(attempt).subscribe({
      next: () => {
        this.loading.set(false);
        // Redirect alla lista dei test dopo l'invio
        this.router.navigate(['/student/tests']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          "Errore nell'invio del tentativo: " + (err?.message || err),
        );
      },
    });
  }
}
