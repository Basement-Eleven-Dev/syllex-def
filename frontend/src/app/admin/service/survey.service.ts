import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../../environments/environment';

export interface SurveyField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'checkbox';
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface Survey {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  active: boolean;
  isAnonymous: boolean;
  fields: SurveyField[];
  createdAt: string;
}

export interface SurveyResponse {
  _id: string;
  surveyId: string;
  respondentId?: { _id: string; name: string; email: string };
  answers: any;
  submittedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private http = inject(HttpClient);
  private apiUrl = apiUrl;

  getSurveys() {
    return this.http.get<{success: boolean, surveys: Survey[]}>(`${this.apiUrl}/admin/surveys`);
  }

  getSurveyById(id: string) {
    return this.http.get<{success: boolean, survey: Survey}>(`${this.apiUrl}/admin/surveys/${id}`);
  }

  createSurvey(survey: Partial<Survey>) {
    return this.http.post<{success: boolean, survey: Survey}>(`${this.apiUrl}/admin/surveys`, survey);
  }

  updateSurvey(id: string, survey: Partial<Survey>) {
    return this.http.put<{success: boolean, survey: Survey}>(`${this.apiUrl}/admin/surveys/${id}`, survey);
  }

  getSurveyResponses(id: string) {
    return this.http.get<{success: boolean, responses: SurveyResponse[]}>(`${this.apiUrl}/admin/surveys/${id}/responses`);
  }
}
