import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReportInterface {
  _id?: string;
  comment: string;
  url?: string;
  userAgent?: string;
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
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

  getReports(): Observable<{ success: boolean; reports: ReportInterface[] }> {
    return this.http.get<{ success: boolean; reports: ReportInterface[] }>('reports');
  }

  updateReportStatus(reportId: string, status: string): Observable<{ success: boolean; report: ReportInterface }> {
    return this.http.put<{ success: boolean; report: ReportInterface }>(`reports/${reportId}`, { status });
  }
}
