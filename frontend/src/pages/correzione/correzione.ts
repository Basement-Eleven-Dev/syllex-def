import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faClock,
  faQuestionCircle,
  faTimes,
  faUser,
} from '@fortawesome/pro-solid-svg-icons';
import { faCircle } from '@fortawesome/pro-regular-svg-icons';
import { QuestionCorrection } from '../../components/question-correction/question-correction';
import { QuestionInterface } from '../../services/questions';
import { data } from './correzione.mock';

export interface AnswerData {
  result: 'correct' | 'wrong' | 'dubious' | 'empty';
  answer: string;
  feedback: string;
  score: number;
  maxScore: number;
}

export interface CorrezioneData {
  testTitle: string;
  studentName: string;
  status: 'da correggere' | 'corretto';
  submissionDate: Date;
  score: number;
  timeSpent: number;
  maxScore: number;
  maxTime: number;
  totalQuestions: number;
  questionsStats: {
    correct: number;
    wrong: number;
    dubious: number;
    empty: number;
  };
  questions: {
    question: QuestionInterface;
    answer: AnswerData;
  }[];
}

@Component({
  selector: 'app-correzione',
  imports: [
    FontAwesomeModule,
    RouterLink,
    TitleCasePipe,
    DatePipe,
    QuestionCorrection,
  ],
  templateUrl: './correzione.html',
  styleUrl: './correzione.scss',
})
export class Correzione {
  data: CorrezioneData = data;

  UserIcon = faUser;
  ClockIcon = faClock;
  QuestionMarkIcon = faQuestionCircle;
  CircleIcon = faCircle;

  date: Date = new Date();

  CheckIcon = faCheck;
  TimesIcon = faTimes;

  questionIndex: number = 0;
  selectQuestion(index: number) {
    this.questionIndex = index;
  }
}
