import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  kpis: {
    totalStudents: number;
    totalTeachers: number;
    activeClasses: number;
    publishedTests: number;
    totalAttempts: number;
    activeStudents: number;
  };
  teachingActivity: {
    testsBySubject: Array<{ subject: string; count: number }>;
    teacherLoad: Array<{ 
      name: string; 
      classesCount: number; 
      subjectsCount: number;
      assignedClasses: string[];
      assignedSubjects: string[];
    }>;
    upcomingTests: Array<{
      title: string;
      subject: string;
      availableFrom: string;
    }>;
    avgGradesBySubject: Array<{
      subject: string;
      avgScore: number;
      totalAttempts: number;
    }>;
  };
}

export interface SuperAdminStats {
  globalKpis: {
    totalOrganizations: number;
    totalUsers: number;
    totalChunks: number;
    estimatedTotalTokens: number;
    totalAiMaterials: number;
    totalEstimatedCost: number;
  };
  organizations: Array<{
    organizationId: string;
    name: string;
    userCount: number;
    documentCount: number;
    chunkCount: number;
    estimatedTokens: number;
    aiMaterialCount: number;
    estimatedCost: number;
    onboardingStatus: string;
  }>;
  technicalAnalysis: {
    heavySubjects: Array<{
      subjectId: string;
      name: string;
      chunkCount: number;
      estimatedTokens: number;
    }>;
    activeTeachers: Array<{
      teacherId: string;
      name: string;
      documentCount: number;
      chunkCount: number;
    }>;
    topAiProducers: Array<{
      name: string;
      count: number;
    }>;
    metrics: {
      avgChunkSize: number;
      avgChunksPerDoc: number;
      totalTextLength: number;
      totalChunks: number;
      totalDocuments: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);

  getOrganizationStats(orgId: string): Observable<AdminStats> {
    return this.http.get<AdminStats>(`admin/organizations/${orgId}/stats`);
  }

  getSuperAdminStats(): Observable<SuperAdminStats> {
    return this.http.get<SuperAdminStats>('admin/stats/global');
  }
}
