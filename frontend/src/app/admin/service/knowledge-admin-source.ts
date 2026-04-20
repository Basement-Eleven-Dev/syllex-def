import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { FilesService } from '../../../services/files-service';
import { getFileExtension } from '../../_utils/file-validation.utils';
import { HttpClient } from '@angular/common/http';

export interface KnowledgeDocumentInterface {
  _id: string;
  name: string;
  url: string;
  extension: string;
  createdAt: Date;
  byteSize: number;
  role: 'student' | 'teacher' | 'both';
  vectorized: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeAdminSource {
  private readonly fileService = inject(FilesService);

  constructor(private http: HttpClient) {}

  /**
   * Performs the full upload flow:
   * 1. Get a presigned upload URL from the backend
   * 2. Upload the file to S3
   * 3. Save the document metadata to the database
   */
  uploadKnowledgeDocument(
    file: File,
    role: 'student' | 'teacher' | 'both' = 'both'
  ): Observable<KnowledgeDocumentInterface> {
    // Step 1: Get presigned URL
    return this.http
      .post<{ uploadUrl: string; key: string; url: string }>(
        'admin/knowledge-source/upload',
        {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        }
      )
      .pipe(
        // Step 2: Upload to S3
        switchMap((response) =>
          this.fileService.uploadFileToS3(response.uploadUrl, file).pipe(
            // Step 3: Save metadata to DB
            switchMap(() =>
              this.http.post<{ success: boolean; data: KnowledgeDocumentInterface }>(
                'admin/knowledge-source/save',
                {
                  name: file.name,
                  url: response.url, // The public URL returned by the upload function
                  extension: getFileExtension(file.name),
                  byteSize: file.size,
                  role: role,
                }
              )
            )
          )
        ),
        map((response) => response.data)
      );
  }

  deleteDoc(id: string): Observable<void> {
    return this.http.delete<void>(`admin/knowledge-source/${id}`);
  }

  getKnowledgeDocuments(): Observable<KnowledgeDocumentInterface[]> {
    return this.http.get<KnowledgeDocumentInterface[]>('admin/knowledge-source');
  }

  updateDoc(id: string, data: Partial<KnowledgeDocumentInterface>): Observable<KnowledgeDocumentInterface> {
    return this.http.patch<{ success: boolean; data: KnowledgeDocumentInterface }>(
      `admin/knowledge-source/${id}`,
      data
    ).pipe(map(res => res.data));
  }

  getKnowledgeDocument(id: string): Observable<KnowledgeDocumentInterface> {
    return this.http.get<KnowledgeDocumentInterface>(
      `admin/knowledge-source/${id}`
    );
  }
}
