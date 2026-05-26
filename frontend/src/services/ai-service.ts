import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MaterialType, QuestionType } from '../types/question.types';

export type BackendQuestionType = 'open' | 'true-false' | 'multiple';
export type BackendMaterialType = 'slides' | 'map' | 'glossary' | 'summary';

const QUESTION_TYPE_MAP: Record<QuestionType, BackendQuestionType> = {
  'scelta multipla': 'multiple',
  'vero falso': 'true-false',
  'risposta aperta': 'open',
};

const MATERIAL_TYPE_MAP: Record<MaterialType, BackendMaterialType> = {
  slides: 'slides',
  riassunto: 'summary',
  glossario: 'glossary',
  'mappe-concettuali': 'map',
};

import { QuestionDifficulty } from '../types/question.types';

export interface GenerateQuestionRequest {
  topicId: string;
  materialIds: string[];
  type: BackendQuestionType;
  instructions?: string;
  language?: string;
  difficulty?: QuestionDifficulty;
  numberOfAlternatives?: number;
  count?: number;
}

export interface GeneratedQuestionOption {
  label: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: QuestionType;
  text: string;
  explanation: string;
  correctAnswer?: boolean;
  options?: GeneratedQuestionOption[];
  topicId?: string;
}

export interface GenerateMaterialRequest {
  type: BackendMaterialType;
  materialIds: string[];
  numberOfSlides?: number;
  format?: 'pdf' | 'pptx';
  additionalInstructions?: string;
  language?: string;
}

export interface GeneratedMaterial {
  _id: string;
  name: string;
  url?: string;
  extension?: string;
  isMap?: boolean;
  aiGenerated?: boolean;
  type?: 'file' | 'folder';
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);

  extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const payloadMessage = error.error?.message;
      if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
        return payloadMessage;
      }
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Errore durante la generazione. Riprova.';
  }

  async generateQuestion(data: {
    topicId: string;
    materialIds: string[];
    type: QuestionType;
    instructions?: string;
    language?: string;
    difficulty?: QuestionDifficulty;
    numberOfAlternatives?: number;
  }): Promise<GeneratedQuestion> {
    const payload: GenerateQuestionRequest = {
      topicId: data.topicId,
      materialIds: data.materialIds,
      type: QUESTION_TYPE_MAP[data.type],
      instructions: data.instructions,
      language: data.language,
      difficulty: data.difficulty,
      numberOfAlternatives: data.numberOfAlternatives,
    };
    const response = await firstValueFrom(
      this.http.post<{ question: GeneratedQuestion }>('ai/questions', payload),
    );
    return response.question;
  }

  /** Generates N questions in a single backend call to ensure variety,
   * prevent duplicates, and optimize performance.
   * Returns the generated questions plus the number of failed requests.
   */
  async generateQuestions(
    data: Parameters<AiService['generateQuestion']>[0],
    count: number,
  ): Promise<{ questions: GeneratedQuestion[]; failedCount: number }> {
    const payload: GenerateQuestionRequest = {
      topicId: data.topicId,
      materialIds: data.materialIds,
      type: QUESTION_TYPE_MAP[data.type],
      instructions: data.instructions,
      language: data.language,
      difficulty: data.difficulty,
      numberOfAlternatives: data.numberOfAlternatives,
      count,
    };
    try {
      const response = await firstValueFrom(
        this.http.post<{ questions: GeneratedQuestion[] }>('ai/questions', payload),
      );
      return { questions: response.questions || [], failedCount: 0 };
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  async generateMaterial(data: {
    type: MaterialType;
    materialIds: string[];
    numberOfSlides?: number;
    format?: 'pdf' | 'pptx';
    additionalInstructions?: string;
    language?: string;
  }): Promise<GeneratedMaterial> {
    const payload: GenerateMaterialRequest = {
      type: MATERIAL_TYPE_MAP[data.type],
      materialIds: data.materialIds,
      numberOfSlides: data.numberOfSlides,
      format: data.format,
      additionalInstructions: data.additionalInstructions || undefined,
      language: data.language,
    };
    try {
      const response = await firstValueFrom(
        this.http.post<{ material: GeneratedMaterial }>('ai/materials', payload),
      );
      return response.material;
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }
}
