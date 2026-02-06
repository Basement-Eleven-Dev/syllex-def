import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Auth } from './auth';

export interface TopicObject {
  id: string;
  name: string;
}
export interface MateriaObject {
  id: string;
  name: string;
  topics: TopicObject[];
}
@Injectable({
  providedIn: 'root',
})
export class Materia {
  private readonly STORAGE_KEY = 'selectedSubjectId';
  allMaterie: MateriaObject[] = [];

  materiaSelected = signal<MateriaObject | null>(null);

  constructor(
    private http: HttpClient,
    private authService: Auth,
  ) {
    this.getMaterieTeacher();
  }

  getMaterieTeacher(): MateriaObject[] {
    let teacherId = this.authService.user?._id;
    this.http
      .get<MateriaObject[]>(`/teachers/${teacherId}/subjects`)
      .subscribe((materie) => {
        this.allMaterie = materie;
        console.log('Materie del teacher:', this.allMaterie);
        this.loadSavedSubject();
      });

    return this.allMaterie;
  }

  /**
   * Carica la materia salvata dal localStorage o seleziona la prima disponibile
   */
  private loadSavedSubject(): void {
    const savedId = localStorage.getItem(this.STORAGE_KEY);

    if (savedId) {
      const savedSubject = this.allMaterie.find((m) => m.id === savedId);
      if (savedSubject) {
        this.materiaSelected.set(savedSubject);
        return;
      }
    }

    // Fallback alla prima materia se non c'è niente salvato o la materia salvata non esiste più
    if (this.allMaterie.length > 0) {
      this.setSelectedSubject(this.allMaterie[0]);
    }
  }

  /**
   * Imposta la materia selezionata e la salva nel localStorage
   */
  setSelectedSubject(subject: MateriaObject): void {
    this.materiaSelected.set(subject);
    localStorage.setItem(this.STORAGE_KEY, subject.id);
  }
}
