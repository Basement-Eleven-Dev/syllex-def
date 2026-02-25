import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  constructor(private http: HttpClient) {}

  submitOnboarding(payload: any): Observable<any> {
    return this.http.post('admin/onboarding', payload);
  }

  getOrganizations(): Observable<any> {
    return this.http.get('admin/organizations');
  }

  getWorkspaceDetails(orgId: string): Observable<any> {
    return this.http.get(`admin/organizations/${orgId}/workspace`);
  }

  getWorkspaceStaff(orgId: string): Observable<any> {
    return this.http.get(`admin/organizations/${orgId}/staff`);
  }

  getWorkspaceStudents(orgId: string): Observable<any> {
    return this.http.get(`admin/organizations/${orgId}/students`);
  }

  getWorkspaceDidactics(orgId: string): Observable<any> {
    return this.http.get(`admin/organizations/${orgId}/didactics`);
  }

  addUser(orgId: string, payload: any): Observable<any> {
    return this.http.post(`admin/organizations/${orgId}/users`, payload);
  }

  bulkImportStudents(orgId: string, classId: string, students: any[]): Observable<any> {
    return this.http.post(`admin/organizations/${orgId}/students/bulk`, { classId, students });
  }

  getClassDetail(orgId: string, classId: string): Observable<any> {
    return this.http.get(`admin/organizations/${orgId}/classes/${classId}`);
  }

  removeUser(orgId: string, userId: string): Observable<any> {
    return this.http.delete(`admin/organizations/${orgId}/users/${userId}`);
  }
}
