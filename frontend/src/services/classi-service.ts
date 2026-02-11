import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Materia } from './materia';

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
    const SubjectId = this.materiaService.materiaSelected()?._id;
    if (!SubjectId) {
      console.warn('No subject selected');
      return;
    }

    this.http
      .get<ClassInterface[]>(`teacher/${SubjectId}/classes`)
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
}
