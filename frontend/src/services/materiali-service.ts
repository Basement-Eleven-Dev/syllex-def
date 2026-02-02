import { Injectable } from '@angular/core';

interface Materiale {
  id: string;
  filename: string;
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
      id: 'root',
      name: 'Pdf Lezioni',
      content: [
        {
          id: '1',
          filename: 'Lezione_1.pdf',
          url: '/materials/Lezione_1.pdf',
          extension: 'pdf',
        },
        {
          id: 'root',
          name: 'Lezioni vecchie',
          content: [
            {
              id: '1',
              filename: 'Lezione_vecchia-1.pdf',
              url: '/materials/Lezione_vecchia-1.pdf',
              extension: 'pdf',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      filename: 'Appunti_Vacanze.docx',
      url: '/materials/Appunti_Vacanze.docx',
      extension: 'docx',
    },
  ];

  constructor() {}
}
