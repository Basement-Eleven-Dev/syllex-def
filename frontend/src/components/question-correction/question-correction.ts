import { Component, Input } from '@angular/core';
import { Question } from '../search-questions/search-questions';
import { AnswerData } from '../../pages/correzione/correzione';

@Component({
  selector: 'app-question-correction',
  imports: [],
  templateUrl: './question-correction.html',
  styleUrl: './question-correction.scss',
})
export class QuestionCorrection {
  @Input() index: number = 1;
  @Input() data: {
    question: Question;
    answer: AnswerData;
  } = {
    question: {
      id: 'q1',
      text: 'Domanda di esempio',
      type: 'risposta aperta',
      topic: 'Matematica',
      explanation: 'Spiegazione della domanda di esempio',
      policy: 'pubblica',
    },
    answer: {
      result: 'correct',
      answer:
        'Duis mollit consequat adipisicing occaecat ipsum et anim occaecat magna deserunt et. Cillum qui exercitation in nostrud commodo nisi. Aute officia labore ipsum enim mollit labore exercitation eu. Labore aute tempor consequat culpa ipsum id amet consequat enim labore velit amet. Sint ipsum officia do amet est esse minim aute. Adipisicing sint culpa veniam sit do fugiat ea non pariatur ullamco duis.',
      feedback:
        'Deserunt officia tempor anim labore nostrud aute laboris veniam consequat et mollit amet esse enim. Et commodo in quis minim. Pariatur dolor ipsum consequat pariatur nisi. Nisi non deserunt anim voluptate esse consectetur veniam voluptate commodo mollit magna. Amet proident mollit incididunt amet duis aliquip id do.',
      score: 2,
      maxScore: 2,
    },
  };

  getResultLabel(value: string): string {
    switch (value) {
      case 'correct':
        return 'Corretta';
      case 'wrong':
        return 'Sbagliata';
      case 'dubious':
        return 'Dubbia';
      case 'empty':
        return 'Non risposta';
      default:
        return '';
    }
  }
}
