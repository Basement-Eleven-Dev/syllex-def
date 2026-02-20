import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
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
    if (this.authService.user?.role === 'student') {
      this.getMaterieStudent();
    } else {
      this.getMaterieTeacher();
    }
  }

  getMaterieStudent(): void {
    this.http
      .get<{
        success: boolean;
        subjects: MateriaObject[];
      }>('students/me/subjects')
      .subscribe((res) => {
        if (res.success) {
          this.allMaterie.set(res.subjects);
          console.log('Materie dello studente:', res.subjects);
          this.loadSavedSubject();
        }
      });
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

  addTopic(
    subjectId: string,
    name: string,
  ): Observable<{ success: boolean; topic: TopicObject }> {
    return this.http
      .post<{
        success: boolean;
        topic: TopicObject;
      }>(`subjects/${subjectId}/topics`, { name })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.allMaterie.update((materie) =>
              materie.map((m) =>
                m._id === subjectId
                  ? { ...m, topics: [...m.topics, res.topic] }
                  : m,
              ),
            );
            if (this.materiaSelected()?._id === subjectId) {
              this.materiaSelected.update((s) =>
                s ? { ...s, topics: [...s.topics, res.topic] } : s,
              );
            }
          }
        }),
      );
  }

  renameTopic(
    subjectId: string,
    topicId: string,
    name: string,
  ): Observable<{ success: boolean; renamed: boolean }> {
    return this.http
      .put<{
        success: boolean;
        renamed: boolean;
      }>(`subjects/${subjectId}/topics/${topicId}`, { name })
      .pipe(
        tap((res) => {
          if (res.success) {
            const updateTopics = (topics: TopicObject[]) =>
              topics.map((t) => (t._id === topicId ? { ...t, name } : t));
            this.allMaterie.update((materie) =>
              materie.map((m) =>
                m._id === subjectId
                  ? { ...m, topics: updateTopics(m.topics) }
                  : m,
              ),
            );
            if (this.materiaSelected()?._id === subjectId) {
              this.materiaSelected.update((s) =>
                s ? { ...s, topics: updateTopics(s.topics) } : s,
              );
            }
          }
        }),
      );
  }
}
