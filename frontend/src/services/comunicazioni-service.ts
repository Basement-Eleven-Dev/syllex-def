import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Materia } from './materia';

export interface ComunicazioneInterface {
  _id?: string;
  title: string;
  content: string;
  classIds: string[];
  materialIds: string[];
  subjectId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ComunicazioniService {
  constructor(
    private http: HttpClient,
    private materiaService: Materia,
  ) {}

  createComunicazione(
    data: ComunicazioneInterface,
  ): Observable<{ communication: ComunicazioneInterface }> {
    data.subjectId = this.materiaService.materiaSelected()!._id;
    return this.http.post<{ communication: ComunicazioneInterface }>(
      'communications',
      data,
    );
  }

  getComunicazioneById(
    id: string,
  ): Observable<{ communication: ComunicazioneInterface }> {
    return this.http.get<{ communication: ComunicazioneInterface }>(
      `communications/${id}`,
    );
  }

  editComunicazione(
    id: string,
    data: ComunicazioneInterface,
  ): Observable<{ communication: ComunicazioneInterface }> {
    data.subjectId = this.materiaService.materiaSelected()!._id;
    return this.http.put<{ communication: ComunicazioneInterface }>(
      `communications/${id}`,
      data,
    );
  }

  deleteComunicazione(
    id: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `communications/${id}`,
    );
  }

  getPagedComunicazioni(
    searchTerm: string,
    classId: string,
    hasAttachments: string,
    page: number,
    pageSize: number,
  ): Observable<{ communications: ComunicazioneInterface[]; total: number }> {
    const subjectId = this.materiaService.materiaSelected()?._id;

    const params: any = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      subjectId: subjectId,
    };

    if (searchTerm) params.searchTerm = searchTerm;
    if (classId) params.classId = classId;
    if (hasAttachments) params.hasAttachments = hasAttachments;

    return this.http.get<{
      communications: ComunicazioneInterface[];
      total: number;
    }>('communications', { params });
  }
}
