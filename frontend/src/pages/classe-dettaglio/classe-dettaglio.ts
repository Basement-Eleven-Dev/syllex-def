import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
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
import { ClasseInterface, ClassiService } from '../../services/classi-service';

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
    RouterModule,
  ],
  templateUrl: './classe-dettaglio.html',
  styleUrl: './classe-dettaglio.scss',
})
export class ClasseDettaglio {
  ChartIcon = faChartLine;
  UsersIcon = faUsers;

  classe: ClasseInterface | undefined = undefined;

  stats: Stat[] = [
    {
      label: 'Numero Studenti',
      value: 0,
    },
    {
      label: 'Performance Media',
      requirePercentage: true,
      value: 0,
    },
    {
      label: 'Test Assegnati',
      value: 0,
      link: '/t/tests/new',
      linkLabel: 'Nuovo test',
    },
    {
      label: 'Test Consegnati',
      value: 0,
      link: '/t/classe-dettaglio/test-consegnati',
      linkLabel: 'Vedi tutti',
    },
  ];

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

  constructor(
    private route: ActivatedRoute,
    private classiService: ClassiService,
    private router: Router,
  ) {
    this.route.params.subscribe((params) => {
      const classeId = params['classeId'];
      this.classe =
        this.classiService.classi.find((c) => c._id === classeId) ||
        this.classe;

      if (!this.classe) {
        console.warn('Classe non trovata per ID:', classeId);
        this.router.navigate(['/t/classi']); // Torna alla lista delle classi se non troviamo la classe
        return;
      }
      this.stats[0].value = this.classe.students.length;
      this.stats[2].queryParams = { assign: this.classe._id };
      this.sections[0].component.classeId = this.classe._id;
      this.sections[1].component.classeId = this.classe._id;
    });
  }

  activeSection: number = 1; // 1: Studenti, 2: Statistiche

  ngOnInit() {}
}
