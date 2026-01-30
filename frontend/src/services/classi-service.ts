import { Injectable } from '@angular/core';

export interface ClasseObject {
  id: string;
  nome: string;
  studentsCount: number;
  annoScolastico: number;
  subject: string;
}
@Injectable({
  providedIn: 'root',
})
export class ClassiService {
  classi: ClasseObject[] = [
    {
      id: '1',
      nome: 'Classe A',
      studentsCount: 25,
      annoScolastico: 2023,
      subject: 'Matematica',
    },
    {
      id: '2',
      nome: 'Classe B',
      studentsCount: 30,
      annoScolastico: 2023,
      subject: 'Storia',
    },
    {
      id: '3',
      nome: 'Classe C',
      studentsCount: 28,
      annoScolastico: 2023,
      subject: 'Scienze',
    },
  ];

  constructor() {}
}
