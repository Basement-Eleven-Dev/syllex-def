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
}
