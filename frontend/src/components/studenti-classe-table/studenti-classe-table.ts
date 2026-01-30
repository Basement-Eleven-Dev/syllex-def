import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/pro-solid-svg-icons';

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
  imports: [FontAwesomeModule],
  templateUrl: './studenti-classe-table.html',
  styleUrl: './studenti-classe-table.scss',
})
export class StudentiClasseTable {
  @Input() classeId!: string;
  EyeIcon = faEye;

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
}
