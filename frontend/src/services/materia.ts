import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

export interface TopicObject {
  id: string;
  label: string;
}
export interface MateriaObject {
  id: string;
  label: string;
  topics: TopicObject[];
}
@Injectable({
  providedIn: 'root',
})
export class Materia {
  allMaterie: MateriaObject[] = [
    { id: '1', label: 'Scienze', topics: [] },
    { id: '2', label: 'Geografia', topics: [] },
    { id: '3', label: 'Informatica', topics: [] },
  ];

  materiaSelected: BehaviorSubject<MateriaObject>;

  constructor() {
    const savedMateria = localStorage.getItem('materiaSelected');
    const initialMateria = savedMateria
      ? JSON.parse(savedMateria)
      : this.allMaterie[0];

    this.materiaSelected = new BehaviorSubject<MateriaObject>(initialMateria);

    this.materiaSelected.subscribe((materia) => {
      console.log('Materia selezionata:', materia);
      localStorage.setItem('materiaSelected', JSON.stringify(materia));
    });
  }

  switchMateria(materia: MateriaObject): void {
    this.materiaSelected.next(materia);
  }

  getMaterieTeacher(): MateriaObject[] {
    // In un'applicazione reale, questo metodo potrebbe fare una chiamata HTTP
    // per ottenere le materie assegnate al docente loggato.
    return this.allMaterie;
  }
}
