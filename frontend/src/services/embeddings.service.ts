import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmbeddingsService {
  constructor(private http: HttpClient) {}

  /**
   * Vectorize a list of materials for a specific subject.
   */
  vectorizeMaterials(
    materialIds: string[],
    subjectId: string,
    assistantId: string,
  ): Observable<{ success: boolean; results: any[] }> {
    return this.http.post<{ success: boolean; results: any[] }>(
      'materials/vectorize',
      { materialIds, subjectId, assistantId },
    );
  }
}
