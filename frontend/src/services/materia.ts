import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

export interface MateriaObject {
  id: string;
  label: string;
}
@Injectable({
  providedIn: 'root',
})
export class Materia {
  allMaterie: MateriaObject[] = [
    { id: '1', label: 'Scienze' },
    { id: '2', label: 'Geografia' },
    { id: '3', label: 'Informatica' },
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
}
