import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';

interface Studente {
  nome: string;
  cognome: string;
  email: string;
  performance: number;
  completedTests: number;
}
interface StudentiClasseTableProps {
  classeId: string;
  studenti: Studente[];
}

@Component({
  selector: 'app-studenti-classe-table',
  imports: [FontAwesomeModule, SyllexPagination, FormsModule],
  templateUrl: './studenti-classe-table.html',
  styleUrl: './studenti-classe-table.scss',
})
export class StudentiClasseTable {
  @Input() classeId!: string;
  EyeIcon = faEye;

  page: number = 1;
  pageSize: number = 5;
  collectionSize: number = 10;

  props: StudentiClasseTableProps = {
    classeId: this.classeId,
    studenti: [
      {
        nome: 'Mario',
        cognome: 'Rossi',
        email: 'mario.rossi@example.com',
        performance: 85,
        completedTests: 10,
      },
      {
        nome: 'Mario',
        cognome: 'Rossi',
        email: 'mario.rossi@example.com',
        performance: 85,
        completedTests: 10,
      },
    ],
  };

  onNewPageRequested() {}
}
