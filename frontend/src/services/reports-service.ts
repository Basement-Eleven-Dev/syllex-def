import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReportInterface {
  comment: string;
  url?: string;
  userAgent?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly http = inject(HttpClient);

  createReport(report: ReportInterface): Observable<{
    success: boolean;
    reportId: string;
    message: string;
  }> {
    return this.http.post<{
      success: boolean;
      reportId: string;
      message: string;
    }>('reports', report);
  }
}
