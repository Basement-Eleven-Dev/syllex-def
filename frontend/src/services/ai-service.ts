import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

export interface GenerateQuestionRequest {
  topicId: string;
  materialIds: string[];
  type: BackendQuestionType;
  instructions?: string;
  language?: string;
  difficulty?: 1 | 2 | 3;
  numberOfAlternatives?: number;
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
}

export interface GenerateMaterialRequest {
  type: BackendMaterialType;
  materialIds: string[];
  numberOfSlides?: number;
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

  async generateQuestion(data: {
    topicId: string;
    materialIds: string[];
    type: QuestionType;
    instructions?: string;
    language?: string;
    difficulty?: 1 | 2 | 3;
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

  /** Generates N questions in parallel using the same parameters.
   * Uses allSettled so that individual failures don't abort the whole batch.
   * Returns the fulfilled questions plus the number of failed requests.
   */
  async generateQuestions(
    data: Parameters<AiService['generateQuestion']>[0],
    count: number,
  ): Promise<{ questions: GeneratedQuestion[]; failedCount: number }> {
    const results = await Promise.allSettled(
      Array.from({ length: count }, () => this.generateQuestion(data)),
    );
    const questions = results
      .filter(
        (r): r is PromiseFulfilledResult<GeneratedQuestion> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);
    const failedCount = results.filter((r) => r.status === 'rejected').length;
    return { questions, failedCount };
  }

  async generateMaterial(data: {
    type: MaterialType;
    materialIds: string[];
    numberOfSlides?: number;
    additionalInstructions?: string;
    language?: string;
  }): Promise<GeneratedMaterial> {
    const payload: GenerateMaterialRequest = {
      type: MATERIAL_TYPE_MAP[data.type],
      materialIds: data.materialIds,
      numberOfSlides: data.numberOfSlides,
      additionalInstructions: data.additionalInstructions || undefined,
      language: data.language,
    };
    const response = await firstValueFrom(
      this.http.post<{ material: GeneratedMaterial }>('ai/materials', payload),
    );
    return response.material;
  }
}
