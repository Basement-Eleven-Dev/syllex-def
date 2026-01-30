import { Injectable } from '@angular/core';
import { QuestionType } from '../components/question-type-selectors/question-type-selectors';
import { AnswerOption } from '../pages/create-edit-question/create-edit-question';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  generateQuestion(data: {
    type: QuestionType;
    topic: string;
    details: string;
    materials: string[];
    attachedFile: File | null;
  }): Promise<{
    content: string;
    explanation: string;
    choices?: AnswerOption[];
  }> {
    // Simula una chiamata a un'API di generazione di domande AI
    return new Promise((resolve) => {
      console.log('Generating question with data:', data);
      setTimeout(() => {
        resolve({
          content: `Domanda generata di tipo ${data.type} su ${data.topic} con dettagli: ${data.details}`,
          explanation: 'Spiegazione simulata',
          choices:
            data.type === 'scelta multipla'
              ? [
                  { label: 'Porca ', isCorrect: false },
                  { label: 'Troia 2', isCorrect: false },
                  { label: 'Opzione 3', isCorrect: false },
                  { label: 'Opzione 4', isCorrect: true },
                ]
              : undefined,
        });
      }, 2000); // Simula un ritardo di 2 secondi
    });
  }
}
