import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentiClasseTable } from '../../components/studenti-classe-table/studenti-classe-table';

interface ClasseDettaglioProps {
  id: string;
  nomeClasse: string;
  numeroStudenti: number;
  annoScolastico: number;
  performanceMedia: number;
  testAssegnati: number;
  testConsegnati: number;
}

interface Stat {
  label: string;
  value: number;
  requirePercentage?: boolean;
  link?: string;
  linkLabel?: string;
}

@Component({
  selector: 'app-classe-dettaglio',
  imports: [RouterLink, StudentiClasseTable],
  templateUrl: './classe-dettaglio.html',
  styleUrl: './classe-dettaglio.scss',
})
export class ClasseDettaglio {
  classeDettaglio: ClasseDettaglioProps = {
    id: '1',
    nomeClasse: '3A Informatica',
    numeroStudenti: 25,
    annoScolastico: 2025,
    performanceMedia: 85,
    testAssegnati: 10,
    testConsegnati: 8,
  };

  stats: Stat[] = [
    {
      label: 'Numero Studenti',
      value: this.classeDettaglio.numeroStudenti,
    },
    {
      label: 'Performance Media',
      requirePercentage: true,
      value: this.classeDettaglio.performanceMedia,
    },
    {
      label: 'Test Assegnati',
      value: this.classeDettaglio.testAssegnati,
      link: '/t/classe-dettaglio/test-assegnati',
      linkLabel: 'Nuovo test',
    },
    {
      label: 'Test Consegnati',
      value: this.classeDettaglio.testConsegnati,
      link: '/t/classe-dettaglio/test-consegnati',
      linkLabel: 'Vedi tutti',
    },
  ];
}
