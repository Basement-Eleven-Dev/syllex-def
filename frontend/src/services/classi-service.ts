import { HttpClient } from '@angular/common/http';
import { Injectable, effect, signal } from '@angular/core';
import { Auth } from './auth';
import { Materia } from './materia';
import { Observable } from 'rxjs/internal/Observable';

export interface ClasseInterface {
  _id: string;
  name: string;
  year: number;
  students: string[];
}

export interface AssegnazioneInterface {
  class: ClasseInterface;
  subjectId: string;
}
@Injectable({
  providedIn: 'root',
})
export class ClassiService {
  classi = signal<ClasseInterface[]>([]);
  allAssegnazioni = signal<AssegnazioneInterface[]>([]);

  constructor(
    private http: HttpClient,
    private authService: Auth,
    public materiaService: Materia,
  ) {
    // Usa effect per reagire ai cambiamenti di materiaSelected
    effect(() => {
      const materiaSelezionata = this.materiaService.materiaSelected();
      if (materiaSelezionata) {
        this.getClassiMateriaSelezionata();
        this.getAllAssegnazioni();
      }
    });
  }

  getClassiMateriaSelezionata() {
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

  getAllAssegnazioni() {
    this.http
      .get<AssegnazioneInterface[]>(`teacher/classes`)
      .subscribe((assegnazioni) => {
        this.allAssegnazioni.set(assegnazioni);
      });
  }

  getClassNameById(classId: string): string {
    console.log('Cercando nome per classId:', classId);
    const classi = this.allAssegnazioni().map((a) => a.class);
    const classe = classi.find((c) => c._id === classId);
    return classe ? classe.name : 'Classe sconosciuta';
  }
}
