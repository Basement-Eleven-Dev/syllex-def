import { HttpClient } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import { Auth } from './auth';
import { Materia } from './materia';

export interface ClasseInterface {
  _id: string;
  name: string;
  year: number;
  students: string[];
}
@Injectable({
  providedIn: 'root',
})
export class ClassiService {
  classi = signal<ClasseInterface[]>([]);

  constructor(
    private http: HttpClient,
    private authService: Auth,
    public materiaService: Materia,
  ) {
    // Usa effect per reagire ai cambiamenti di materiaSelected
    effect(() => {
      const materiaSelezionata = this.materiaService.materiaSelected();
      if (materiaSelezionata) {
        this.getClassi();
      }
    });
  }

  getClassi() {
    let subjectId = this.materiaService.materiaSelected()?._id;
    if (!subjectId) {
      console.warn('Nessuna materia selezionata');
      return;
    }
    console.log('Selected subject ID:', subjectId);
    return this.http
      .get<ClasseInterface[]>(`teacher/${subjectId}/classes`)
      .subscribe((classi) => {
        this.classi.set(classi);
        console.log('Classi del teacher:', classi);
      });
  }
}
