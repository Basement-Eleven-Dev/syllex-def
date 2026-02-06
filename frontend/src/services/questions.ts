import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { data } from '../pages/correzione/correzione.mock';
import { Question } from '../components/search-questions/search-questions';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FilesService } from './files-service';

export interface QuestionInterface {
  _id: string;
  text: string;
  explanation: string;
  policy: string;
  topicId: string;
  subjectId: string;
  teacherId: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Questions {
  constructor(
    private http: HttpClient,
    private filesService: FilesService,
  ) {}

  createQuestion(
    q: Question,
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
            'questions/create',
            questionData,
          );
        }),
      );
    }

    // Nessuna immagine, crea la domanda direttamente
    return this.http.post<{ question: QuestionInterface }>(
      'questions/create',
      q,
    );
  }
}
