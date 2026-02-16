import { CorrezioneData } from './correzione';

export const data: CorrezioneData = {
  testTitle: 'Verifica di Matematica - Algebra',
  studentName: 'Mario Rossi',
  status: 'da correggere',
  submissionDate: new Date('2026-02-03T10:30:00'),
  score: 72,
  timeSpent: 2145,
  maxScore: 100,
  maxTime: 3600,
  totalQuestions: 15,
  questionsStats: {
    correct: 6,
    wrong: 4,
    dubious: 2,
    empty: 3,
  },
  questions: [],
};
