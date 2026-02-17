import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FilesService } from './files-service';

export interface QuestionInterface {
  _id: string;
  text: string;
  type: 'scelta multipla' | 'vero falso' | 'risposta aperta';
  explanation: string;
  policy: 'public' | 'private';
  topicId: string;
  subjectId: string;
  teacherId: string;
  imageUrl?: string;
  options?: { label: string; isCorrect: boolean }[];
  correctAnswer?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  constructor(
    private http: HttpClient,
    private filesService: FilesService,
  ) {}

  createQuestion(
    q: QuestionInterface,
    imageFile?: File,
  ): Observable<{ question: QuestionInterface }> {
    console.log('Creating question with data:', q, imageFile);
    // Se c'è un'immagine da caricare, upload su S3 prima di creare la domanda
    if (imageFile) {
      return this.filesService.uploadFile(imageFile.name, imageFile).pipe(
        switchMap((imageUrl) => {
          // Aggiungo l'URL pubblico S3 alla domanda
          const questionData = { ...q, imageUrl };
          return this.http.post<{ question: QuestionInterface }>(
            'questions',
            questionData,
          );
        }),
      );
    }

    // Nessuna immagine, crea la domanda direttamente
    return this.http.post<{ question: QuestionInterface }>('questions', q);
  }

  editQuestion(
    id: string,
    q: QuestionInterface,
    imageFile?: File,
  ): Observable<{ question: QuestionInterface }> {
    console.log('Editing question with data:', id, q, imageFile);
    if (imageFile) {
      return this.filesService.uploadFile(imageFile.name, imageFile).pipe(
        switchMap((imageUrl) => {
          const questionData = { ...q, imageUrl };
          return this.http.put<{ question: QuestionInterface }>(
            `questions/${id}/edit`,
            questionData,
          );
        }),
      );
    }

    return this.http.put<{ question: QuestionInterface }>(
      `questions/${id}/edit`,
      q,
    );
  }

  loadQuestion(id: string): Observable<QuestionInterface> {
    return this.http.get<QuestionInterface>(`questions/${id}`);
  }

  loadPagedQuestions(
    searchTerm?: string,
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta',
    topicId?: string,
    policy?: 'public' | 'private',
    page: number = 1,
    pageSize: number = 10,
  ): Observable<{ questions: QuestionInterface[]; total: number }> {
    const params = new URLSearchParams();

    if (searchTerm) params.append('searchTerm', searchTerm);
    if (type) params.append('type', type);
    if (topicId) params.append('topicId', topicId);
    if (policy) params.append('policy', policy);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    return this.http.get<{ questions: QuestionInterface[]; total: number }>(
      `questions?${params.toString()}`,
    );
  }
}
