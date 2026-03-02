import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Materia } from './materia';
import { Auth, User } from './auth';
import { Observable } from 'rxjs/internal/Observable';
import { TestInterface } from './tests-service';

export interface ClassInterface {
  _id: string;
  name: string;
  year: number;
  students: string[];
}

export interface AssignmentInterface {
  class: ClassInterface;
  subjectId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClassiService {
  private readonly http = inject(HttpClient);
  private readonly materiaService = inject(Materia);
  private readonly auth = inject(Auth);

  readonly Classes = signal<ClassInterface[]>([]);
  readonly AllAssignments = signal<AssignmentInterface[]>([]);

  constructor() {
    effect(() => {
      const SelectedSubject = this.materiaService.materiaSelected();
      if (SelectedSubject) {
        this.loadClassesForSelectedSubject();
        this.loadAllAssignments();
      }
    });
  }

  private loadClassesForSelectedSubject(): void {
    const endpoint = this.getEndpoint('subject/classes');
    this.http.get<ClassInterface[]>(endpoint).subscribe((classes) => {
      this.Classes.set(classes);
      console.log('Classes loaded:', classes);
    });
  }

  private loadAllAssignments(): void {
    const endpoint = this.getEndpoint('classes/all');
    this.http.get<AssignmentInterface[]>(endpoint).subscribe((assignments) => {
      this.AllAssignments.set(assignments);
    });
  }

  private getEndpoint(path: string): string {
    const user = this.auth.user$.value;
    if (user?.role === 'student') {
      return `student/${path}`;
    }
    return `teacher/${path}`;
  }

  getClassNameById(classId: string): string {
    const AllClasses = this.AllAssignments().map((a) => a.class);
    const FoundClass = AllClasses.find((c) => c._id === classId);
    return FoundClass ? FoundClass.name : 'Unknown class';
  }

  // Legacy compatibility - can be removed after migration
  get classi() {
    return this.Classes;
  }

  getClassStudents(classId: string): Observable<{ students: User[] }> {
    return this.http.get<{ students: User[] }>(`class/${classId}/students`);
  }

  getClassAssignedTests(
    classId: string,
  ): Observable<{ tests: TestInterface[] }> {
    return this.http.get<{ tests: TestInterface[] }>(`class/${classId}/tests`);
  }
}
