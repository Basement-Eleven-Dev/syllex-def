import { Injectable } from '@angular/core';

interface Materiale {
  id: string;
  name: string;
  url: string;
  extension: string;
}

interface Folder {
  id: string;
  name: string;
  content: (Materiale | Folder)[];
}

@Injectable({
  providedIn: 'root',
})
export class MaterialiService {
  root: (Folder | Materiale)[] = [
    {
      id: 'folder-1',
      name: 'Pdf Lezioni',
      content: [
        {
          id: 'file-1',
          name: 'Lezione_1.pdf',
          url: '/materials/Lezione_1.pdf',
          extension: 'pdf',
        },
        {
          id: 'file-2',
          name: 'Lezione_2.pdf',
          url: '/materials/Lezione_2.pdf',
          extension: 'pdf',
        },
        {
          id: 'file-3',
          name: 'Lezione_3.pdf',
          url: '/materials/Lezione_3.pdf',
          extension: 'pdf',
        },
        {
          id: 'folder-2',
          name: 'Lezioni vecchie',
          content: [
            {
              id: 'file-4',
              name: 'Lezione_vecchia-1.pdf',
              url: '/materials/Lezione_vecchia-1.pdf',
              extension: 'pdf',
            },
            {
              id: 'file-5',
              name: 'Lezione_vecchia-2.pdf',
              url: '/materials/Lezione_vecchia-2.pdf',
              extension: 'pdf',
            },
          ],
        },
      ],
    },
    {
      id: 'folder-3',
      name: 'Matematica',
      content: [
        {
          id: 'folder-4',
          name: 'Algebra',
          content: [
            {
              id: 'file-6',
              name: 'Equazioni.pdf',
              url: '/materials/Equazioni.pdf',
              extension: 'pdf',
            },
            {
              id: 'file-7',
              name: 'Esercizi_Algebra.xlsx',
              url: '/materials/Esercizi_Algebra.xlsx',
              extension: 'xlsx',
            },
            {
              id: 'file-8',
              name: 'Soluzioni.docx',
              url: '/materials/Soluzioni.docx',
              extension: 'docx',
            },
          ],
        },
        {
          id: 'folder-5',
          name: 'Geometria',
          content: [
            {
              id: 'file-9',
              name: 'Teoremi.pdf',
              url: '/materials/Teoremi.pdf',
              extension: 'pdf',
            },
            {
              id: 'file-10',
              name: 'Figure_Piane.pptx',
              url: '/materials/Figure_Piane.pptx',
              extension: 'pptx',
            },
          ],
        },
        {
          id: 'file-11',
          name: 'Programma_Annuale.pdf',
          url: '/materials/Programma_Annuale.pdf',
          extension: 'pdf',
        },
      ],
    },
    {
      id: 'folder-6',
      name: 'Storia',
      content: [
        {
          id: 'file-12',
          name: 'Rivoluzione_Francese.pdf',
          url: '/materials/Rivoluzione_Francese.pdf',
          extension: 'pdf',
        },
        {
          id: 'file-13',
          name: 'Napoleone.docx',
          url: '/materials/Napoleone.docx',
          extension: 'docx',
        },
        {
          id: 'folder-7',
          name: 'Documenti storici',
          content: [
            {
              id: 'file-14',
              name: 'Costituzione_1789.pdf',
              url: '/materials/Costituzione_1789.pdf',
              extension: 'pdf',
            },
            {
              id: 'file-15',
              name: 'Lettere_Epoca.txt',
              url: '/materials/Lettere_Epoca.txt',
              extension: 'txt',
            },
          ],
        },
      ],
    },
    {
      id: 'folder-8',
      name: 'Scienze',
      content: [
        {
          id: 'file-16',
          name: 'Biologia_Cellulare.pdf',
          url: '/materials/Biologia_Cellulare.pdf',
          extension: 'pdf',
        },
        {
          id: 'file-17',
          name: 'Esperimenti_Lab.xlsx',
          url: '/materials/Esperimenti_Lab.xlsx',
          extension: 'xlsx',
        },
        {
          id: 'file-18',
          name: 'Video_Microscopia.mp4',
          url: '/materials/Video_Microscopia.mp4',
          extension: 'mp4',
        },
      ],
    },
    {
      id: 'file-19',
      name: 'Appunti_Vacanze.docx',
      url: '/materials/Appunti_Vacanze.docx',
      extension: 'docx',
    },
    {
      id: 'file-20',
      name: 'Calendario_Scolastico.pdf',
      url: '/materials/Calendario_Scolastico.pdf',
      extension: 'pdf',
    },
    {
      id: 'file-21',
      name: 'Regolamento.pdf',
      url: '/materials/Regolamento.pdf',
      extension: 'pdf',
    },
  ];

  constructor() {}
}
