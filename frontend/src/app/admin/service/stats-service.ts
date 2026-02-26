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

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);

  getOrganizationStats(orgId: string): Observable<AdminStats> {
    return this.http.get<AdminStats>(`admin/organizations/${orgId}/stats`);
  }

  getSuperAdminStats(): Observable<any> {
    // Placeholder for future implementation
    return this.http.get<any>('admin/stats/global');
  }
}
