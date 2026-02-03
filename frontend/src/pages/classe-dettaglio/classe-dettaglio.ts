import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentiClasseTable } from '../../components/studenti-classe-table/studenti-classe-table';
import { Section } from '../test-detail/test-detail';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StatisticheClasse } from '../../components/statistiche-classe/statistiche-classe';
import { faChartLine, faUsers } from '@fortawesome/pro-solid-svg-icons';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavItemRole,
  NgbNavLinkBase,
  NgbNavLinkButton,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { NgComponentOutlet } from '@angular/common';

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
  link?: string | string[];
  queryParams?: { [key: string]: string };
  linkLabel?: string;
}

@Component({
  selector: 'app-classe-dettaglio',
  imports: [
    RouterLink,
    StudentiClasseTable,
    FontAwesomeModule,
    StatisticheClasse,
    NgComponentOutlet,
    NgbNavContent,
    NgbNav,
    NgbNavItem,
    NgbNavItemRole,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavOutlet,
  ],
  templateUrl: './classe-dettaglio.html',
  styleUrl: './classe-dettaglio.scss',
})
export class ClasseDettaglio {
  ChartIcon = faChartLine;
  UsersIcon = faUsers;
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
      link: '/t/tests/new',
      queryParams: { assign: this.classeDettaglio.id },
      linkLabel: 'Nuovo test',
    },
    {
      label: 'Test Consegnati',
      value: this.classeDettaglio.testConsegnati,
      link: '/t/classe-dettaglio/test-consegnati',
      linkLabel: 'Vedi tutti',
    },
  ];

  activeSection: number = 1; // 1: Studenti, 2: Statistiche
  sections: Section[] = [
    {
      id: 1,
      title: 'Studenti',
      icon: this.UsersIcon,
      component: StudentiClasseTable,
    },
    {
      id: 2,
      title: 'Statistiche Classe',
      icon: this.ChartIcon,
      component: StatisticheClasse,
    },
  ];

  ngOnInit() {
    this.sections[1].component.classeId = this.classeDettaglio.id;
  }
}
