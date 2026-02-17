import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Materia } from './materia';
import { User } from './auth';
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
    this.http
      .get<ClassInterface[]>('teacher/subject/classes')
      .subscribe((classes) => {
        this.Classes.set(classes);
        console.log('Teacher classes loaded:', classes);
      });
  }

  private loadAllAssignments(): void {
    this.http
      .get<AssignmentInterface[]>(`teacher/classes/all`)
      .subscribe((assignments) => {
        this.AllAssignments.set(assignments);
      });
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
