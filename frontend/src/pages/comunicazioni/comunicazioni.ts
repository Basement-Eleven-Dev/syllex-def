import { Component } from '@angular/core';
import { Materia } from '../../services/materia';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ComunicazioneCard } from '../../components/comunicazione-card/comunicazione-card';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

interface Attachment {
  id: number;
  filename: string;
  url: string;
  extension: 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'txt';
}

export interface Comunicazione {
  id: number;
  titolo: string;
  contenuto: string;
  dataCreazione: Date;
  attachments?: Attachment[];
  classes: string[];
}
@Component({
  selector: 'app-comunicazioni',
  imports: [
    FontAwesomeModule,
    ComunicazioneCard,
    RouterModule,
    NgbPagination,
    FormsModule,
  ],
  templateUrl: './comunicazioni.html',
  styleUrl: './comunicazioni.scss',
})
export class Comunicazioni {
  PlusIcon = faPlus;
  constructor(public materiaService: Materia) {}

  comunicazioni: Comunicazione[] = [
    {
      id: 1,
      titolo: 'Compiti per casa',
      contenuto:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      dataCreazione: new Date('2024-06-10T10:30:00'),
      attachments: [
        {
          filename: 'esercizi_pagina_42.pdf',
          url: '/attachments/esercizi_pagina_42.pdf',
          extension: 'pdf',
          id: 1,
        },
      ],
      classes: ['3A', '3B'],
    },
    {
      id: 1,
      titolo: 'Compiti per casa',
      contenuto:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      dataCreazione: new Date('2024-06-10T10:30:00'),
      attachments: [
        {
          filename: 'esercizi_pagina_42.pdf',
          url: '/attachments/esercizi_pagina_42.pdf',
          extension: 'pdf',
          id: 1,
        },
      ],
      classes: ['3A', '3B'],
    },
    {
      id: 1,
      titolo: 'Compiti per casa',
      contenuto:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      dataCreazione: new Date('2024-06-10T10:30:00'),
      attachments: [
        {
          filename: 'esercizi_pagina_42.pdf',
          url: '/attachments/esercizi_pagina_42.pdf',
          extension: 'pdf',
          id: 1,
        },
      ],
      classes: ['3A', '3B'],
    },
    {
      id: 1,
      titolo: 'Compiti per casa',
      contenuto:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      dataCreazione: new Date('2024-06-10T10:30:00'),
      attachments: [
        {
          filename: 'esercizi_pagina_42.pdf',
          url: '/attachments/esercizi_pagina_42.pdf',
          extension: 'pdf',
          id: 1,
        },
      ],
      classes: ['3A', '3B'],
    },
    {
      id: 1,
      titolo: 'Compiti per casa',
      contenuto:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      dataCreazione: new Date('2024-06-10T10:30:00'),
      attachments: [
        {
          filename: 'esercizi_pagina_42.pdf',
          url: '/attachments/esercizi_pagina_42.pdf',
          extension: 'pdf',
          id: 1,
        },
      ],
      classes: ['3A', '3B'],
    },
  ];

  page: number = 1;
  pageSize: number = 5;
  collectionSize: number = 10;
  onNewPageRequested() {
    throw new Error('Method not implemented.');
  }
}
