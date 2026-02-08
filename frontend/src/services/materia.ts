import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Auth } from './auth';

export interface TopicObject {
  _id: string;
  name: string;
}
export interface MateriaObject {
  _id: string;
  name: string;
  topics: TopicObject[];
}
@Injectable({
  providedIn: 'root',
})
export class Materia {
  private readonly STORAGE_KEY = 'selectedSubjectId';
  allMaterie = signal<MateriaObject[]>([]);

  materiaSelected = signal<MateriaObject | null>(null);
  /** Signal che indica se il prossimo cambio di materia richiede un reload */
  shouldReload = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: Auth,
  ) {
    this.getMaterieTeacher();
  }

  getMaterieTeacher(): MateriaObject[] {
    let teacherId = this.authService.user?._id;
    this.http
      .get<MateriaObject[]>(`teachers/${teacherId}/subjects`)
      .subscribe((materie) => {
        this.allMaterie.set(materie);
        console.log('Materie del teacher:', materie);
        this.loadSavedSubject();
      });

    return this.allMaterie();
  }

  /**
   * Carica la materia salvata dal localStorage o seleziona la prima disponibile
   */
  private loadSavedSubject(): void {
    const savedId = localStorage.getItem(this.STORAGE_KEY);
    const materie = this.allMaterie();

    if (savedId) {
      const savedSubject = materie.find((m) => m._id === savedId);
      if (savedSubject) {
        this.materiaSelected.set(savedSubject);
        return;
      }
    }

    // Fallback alla prima materia se non c'è niente salvato o la materia salvata non esiste più
    if (materie.length > 0) {
      this.materiaSelected.set(materie[0]);
      localStorage.setItem(this.STORAGE_KEY, materie[0]._id);
    }
  }

  /**
   * Imposta la materia selezionata e la salva nel localStorage
   * Questo metodo viene chiamato solo quando l'utente cambia manualmente la materia
   */
  setSelectedSubject(subject: MateriaObject): void {
    this.shouldReload.set(true);
    this.materiaSelected.set(subject);
    localStorage.setItem(this.STORAGE_KEY, subject._id);
  }

  get topics(): TopicObject[] {
    return this.materiaSelected()?.topics || [];
  }

  getTopicName(topicId: string): string {
    const topic = this.topics.find((t) => t._id === topicId);
    return topic ? topic.name : 'Sconosciuto';
  }
}
