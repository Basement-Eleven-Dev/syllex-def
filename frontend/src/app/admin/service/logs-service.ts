import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ActivityLog {
  _id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  subjectId?: string;
  category: 'http' | 'ai' | 'system' | 'client';
  action: string;
  actionLabel?: string;
  route?: string;
  httpMethod?: string;
  startedAt: string;
  durationMs?: number;
  status?: 'success' | 'error';
  httpStatusCode?: number;
  errorType?: string;
  errorMessage?: string;
  rateLimited?: boolean;
  model?: string;
  modality?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  // Contenuto AI catturato (solo eventi 'ai'): prompt + risposta del modello,
  // per indagini su materiale illecito/anomalo generato fuori dalla chat.
  promptContent?: string;
  responseContent?: string;
  finishReason?: string;
  traceId?: string;
  userAgent?: string;
  stage?: string;
  // Eventi client (telemetria): dettagli specifici dell'azione
  payload?: Record<string, unknown>;
  materialId?: string;
  conversationId?: string;
}

export interface LogsFilters {
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  action?: string;
  category?: string;
  status?: string;
  traceId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface CostSummaryModel {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  errors: number;
  rateLimited: number;
  costUsd: number;
}

export type ExportFormat = 'csv' | 'json' | 'descriptive';

export interface ExportResponse {
  success: boolean;
  format: ExportFormat;
  filename: string;
  mimeType: string;
  count: number;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class LogsService {
  private http = inject(HttpClient);

  private buildParams(filters: LogsFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  getLogs(
    filters: LogsFilters = {},
  ): Observable<{ success: boolean; count: number; logs: ActivityLog[] }> {
    return this.http.get<{ success: boolean; count: number; logs: ActivityLog[] }>(
      'admin/logs',
      { params: this.buildParams(filters) },
    );
  }

  getCostSummary(
    filters: Pick<LogsFilters, 'organizationId' | 'from' | 'to'> = {},
  ): Observable<{
    success: boolean;
    totalCostUsd: number;
    models: CostSummaryModel[];
  }> {
    return this.http.get<{
      success: boolean;
      totalCostUsd: number;
      models: CostSummaryModel[];
    }>('admin/logs/cost-summary', { params: this.buildParams(filters) });
  }

  /** Export filtrato (stessi filtri della timeline) in csv | json | descriptive. */
  exportLogs(
    filters: LogsFilters,
    format: ExportFormat,
  ): Observable<ExportResponse> {
    const params = this.buildParams(filters).set('format', format);
    return this.http.get<ExportResponse>('admin/logs/export', { params });
  }
}
