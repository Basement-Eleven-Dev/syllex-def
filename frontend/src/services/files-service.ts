import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  constructor(private http: HttpClient) {}

  /**
   * Carica un file su S3 usando l'URL pre-firmato e restituisce l'URL pubblico del file.
   * Usa fetch() nativo per evitare che gli interceptor di Angular invalidino la firma.
   */
  uploadFileToS3(uploadUrl: string, file: File): Observable<string> {
    return from(
      fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      }).then((response) => {
        if (!response.ok) {
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}`,
          );
        }
        // Estrae l'URL pubblico rimuovendo i parametri di query
        const url = new URL(uploadUrl);
        return `${url.origin}${url.pathname}`;
      }),
    );
  }

  uploadFile(filename: string, file: File): Observable<string> {
    return this.http
      .post<{ uploadUrl: string; key: string }>('files/upload', {
        filename: filename,
        contentType: file.type || 'application/octet-stream',
      })
      .pipe(
        switchMap((response) => this.uploadFileToS3(response.uploadUrl, file)),
      );
  }
}
