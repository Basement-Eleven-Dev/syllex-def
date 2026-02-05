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
  questions: [
    {
      question: {
        id: 'q1',
        text: 'Risolvi la seguente equazione: 2x + 5 = 13',
        type: 'risposta aperta',
        topic: 'Equazioni lineari',
        explanation:
          'Per risolvere questa equazione, isola la variabile x portando i termini noti a destra.',
        policy: 'pubblica',
      },
      answer: {
        result: 'correct',
        answer:
          'x = 4. Sottraggo 5 da entrambi i membri: 2x = 8, poi divido per 2.',
        feedback: 'Ottimo lavoro! Il procedimento è corretto e ben spiegato.',
        score: 8,
        maxScore: 8,
      },
    },
    {
      question: {
        id: 'q2',
        text: 'Quale delle seguenti è la formula corretta del quadrato di binomio?',
        type: 'scelta multipla',
        topic: 'Prodotti notevoli',
        explanation:
          'Ricorda la formula del quadrato della somma di due termini.',
        policy: 'pubblica',
        options: [
          { label: 'a² + b²', isCorrect: false },
          { label: 'a² + 2ab + b²', isCorrect: true },
          { label: 'a² - 2ab + b²', isCorrect: false },
          { label: '2a² + 2b²', isCorrect: false },
        ],
      },
      answer: {
        result: 'correct',
        answer: 'a² + 2ab + b²',
        feedback:
          'Esatto! Hai selezionato la formula corretta del quadrato di binomio.',
        score: 6,
        maxScore: 6,
      },
    },
    {
      question: {
        id: 'q3',
        text: 'Qual è il risultato di (a + b)² ?',
        type: 'risposta aperta',
        topic: 'Prodotti notevoli',
        explanation: 'Ricorda la formula del quadrato di binomio.',
        policy: 'pubblica',
      },
      answer: {
        result: 'correct',
        answer: 'a² + 2ab + b²',
        feedback:
          'Perfetto! Hai applicato correttamente la formula del quadrato di binomio.',
        score: 6,
        maxScore: 6,
      },
    },
    {
      question: {
        id: 'q4',
        text: 'Il Teorema di Pitagora si applica solo ai triangoli rettangoli',
        type: 'vero falso',
        topic: 'Geometria',
        explanation:
          'Pensa alle condizioni necessarie per applicare il teorema.',
        policy: 'pubblica',
        options: [
          { label: 'Vero', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      answer: {
        result: 'correct',
        answer: 'Vero',
        feedback:
          'Corretto! Il Teorema di Pitagora si applica esclusivamente ai triangoli rettangoli.',
        score: 4,
        maxScore: 4,
      },
    },
    {
      question: {
        id: 'q5',
        text: 'Risolvi: x² - 9 = 0',
        type: 'risposta aperta',
        topic: 'Equazioni di secondo grado',
        explanation:
          'Puoi usare la differenza di quadrati o la formula risolutiva.',
        policy: 'pubblica',
      },
      answer: {
        result: 'dubious',
        answer: 'x = 3',
        feedback:
          "Hai trovato solo una delle due soluzioni. L'equazione ha due soluzioni: x = 3 e x = -3.",
        score: 3,
        maxScore: 7,
      },
    },
    {
      question: {
        id: 'q6',
        text: 'Calcola il M.C.D. tra 24 e 36',
        type: 'risposta aperta',
        topic: 'Numeri e proprietà',
        explanation:
          'Il Massimo Comune Divisore è il più grande numero che divide entrambi i numeri.',
        policy: 'pubblica',
      },
      answer: {
        result: 'correct',
        answer: '12',
        feedback: 'Esatto!',
        score: 4,
        maxScore: 4,
      },
    },
    {
      question: {
        id: 'q7',
        text: 'Qual è il risultato di 15 ÷ 3 × 2?',
        type: 'scelta multipla',
        topic: 'Operazioni',
        explanation:
          "Ricorda l'ordine delle operazioni: divisione e moltiplicazione hanno la stessa priorità.",
        policy: 'pubblica',
        options: [
          { label: '2.5', isCorrect: false },
          { label: '10', isCorrect: true },
          { label: '7.5', isCorrect: false },
          { label: '1', isCorrect: false },
        ],
      },
      answer: {
        result: 'wrong',
        answer: '2.5',
        feedback:
          'Non corretto. Le operazioni vanno eseguite da sinistra a destra: 15 ÷ 3 = 5, poi 5 × 2 = 10.',
        score: 0,
        maxScore: 5,
      },
    },
    {
      question: {
        id: 'q8',
        text: 'Calcola il valore numerico di 2a + 3b per a = 5 e b = 2',
        type: 'risposta aperta',
        topic: 'Espressioni algebriche',
        explanation: "Sostituisci i valori delle variabili nell'espressione.",
        policy: 'pubblica',
      },
      answer: {
        result: 'empty',
        answer: '',
        feedback: 'Nessuna risposta fornita.',
        score: 0,
        maxScore: 5,
      },
    },
    {
      question: {
        id: 'q9',
        text: 'La somma di due numeri pari è sempre un numero pari',
        type: 'vero falso',
        topic: 'Numeri e proprietà',
        explanation: 'Rifletti sulle proprietà dei numeri pari.',
        policy: 'pubblica',
        options: [
          { label: 'Vero', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      answer: {
        result: 'correct',
        answer: 'Vero',
        feedback: 'Corretto! La somma di due numeri pari è sempre pari.',
        score: 4,
        maxScore: 4,
      },
    },
    {
      question: {
        id: 'q10',
        text: "Qual è la formula dell'area di un triangolo?",
        type: 'risposta aperta',
        topic: 'Geometria',
        explanation: 'La formula coinvolge base e altezza.',
        policy: 'pubblica',
      },
      answer: {
        result: 'correct',
        answer: 'A = (b × h) / 2',
        feedback: 'Perfetto!',
        score: 4,
        maxScore: 4,
      },
    },
    {
      question: {
        id: 'q11',
        text: 'Quale di queste frazioni è equivalente a 3/4?',
        type: 'scelta multipla',
        topic: 'Frazioni',
        explanation:
          'Per trovare frazioni equivalenti, moltiplica o dividi numeratore e denominatore per lo stesso numero.',
        policy: 'pubblica',
        options: [
          { label: '6/8', isCorrect: true },
          { label: '2/3', isCorrect: false },
          { label: '4/5', isCorrect: false },
          { label: '5/7', isCorrect: false },
        ],
      },
      answer: {
        result: 'dubious',
        answer: '6/8',
        feedback:
          'La risposta è corretta, ma non hai mostrato il ragionamento.',
        score: 4,
        maxScore: 6,
      },
    },
    {
      question: {
        id: 'q12',
        text: 'Calcola: 2/3 + 1/4',
        type: 'risposta aperta',
        topic: 'Frazioni',
        explanation: 'Trova il minimo comune multiplo tra i denominatori.',
        policy: 'pubblica',
      },
      answer: {
        result: 'correct',
        answer: '11/12',
        feedback: 'Corretto! Hai trovato il m.c.m. e sommato correttamente.',
        score: 6,
        maxScore: 6,
      },
    },
    {
      question: {
        id: 'q13',
        text: 'Un angolo retto misura 90 gradi',
        type: 'vero falso',
        topic: 'Geometria',
        explanation: 'Ricorda la definizione di angolo retto.',
        policy: 'pubblica',
        options: [
          { label: 'Vero', isCorrect: true },
          { label: 'Falso', isCorrect: false },
        ],
      },
      answer: {
        result: 'empty',
        answer: '',
        feedback: 'Nessuna risposta fornita.',
        score: 0,
        maxScore: 3,
      },
    },
    {
      question: {
        id: 'q14',
        text: 'Quale operazione ha la priorità nelle espressioni matematiche?',
        type: 'scelta multipla',
        topic: 'Operazioni',
        explanation: "Ricorda l'ordine delle operazioni: PEMDAS/BODMAS.",
        policy: 'pubblica',
        options: [
          { label: 'Addizione', isCorrect: false },
          { label: 'Moltiplicazione', isCorrect: false },
          { label: 'Parentesi', isCorrect: true },
          { label: 'Sottrazione', isCorrect: false },
        ],
      },
      answer: {
        result: 'wrong',
        answer: 'Addizione',
        feedback:
          'Non corretto. Le operazioni tra parentesi hanno la massima priorità, seguite da potenze, poi moltiplicazioni/divisioni, infine addizioni/sottrazioni.',
        score: 0,
        maxScore: 5,
      },
    },
    {
      question: {
        id: 'q15',
        text: 'Calcola il perimetro di un rettangolo con base 8 cm e altezza 5 cm',
        type: 'risposta aperta',
        topic: 'Geometria',
        explanation: 'Il perimetro è la somma di tutti i lati.',
        policy: 'pubblica',
      },
      answer: {
        result: 'empty',
        answer: '',
        feedback: 'Nessuna risposta fornita.',
        score: 0,
        maxScore: 5,
      },
    },
  ],
};
