import { DatePipe, NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavItemRole,
  NgbNavLinkBase,
  NgbNavLinkButton,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { StackedIcon } from '../../components/stacked-icon/stacked-icon';
import {
  faChartLine,
  faCheck,
  faPencilAlt,
  faTrash,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { TestAssignments } from '../../components/test-assignments/test-assignments';
import { TestStats } from '../../components/test-stats/test-stats';

interface TestDetailProps {
  title: string;
  createdAt: Date;
  status: 'bozza' | 'pubblicato' | 'archiviato';
}

interface Stats {
  mainValue: number;
  subValue: number;
  label: string;
  percentageValue?: number;
}

interface Section {
  id: number;
  title: string;
  icon: IconDefinition;
  component: any;
}

@Component({
  selector: 'app-test-detail',
  imports: [
    DatePipe,
    NgComponentOutlet,
    NgbNavContent,
    NgbNav,
    NgbNavItem,
    NgbNavItemRole,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavOutlet,
    FontAwesomeModule,
    TestAssignments,
    TestStats,
  ],
  templateUrl: './test-detail.html',
  styleUrl: './test-detail.scss',
})
export class TestDetail {
  UsersIcon = faUsers;
  CheckIcon = faCheck;
  ChartIcon = faChartLine;
  TrashIcon = faTrash;
  EditIcon = faPencilAlt;

  test: TestDetailProps = {
    title: 'Esempio di Test',
    createdAt: new Date(),
    status: 'bozza',
  };

  activeSection = 2; // 1: Assegnazioni, 2: Statistiche

  stats: Stats[] = [
    {
      mainValue: 150,
      subValue: 75,
      label: 'Consegne',
      percentageValue: 50,
    },
    {
      mainValue: 200,
      subValue: 120,
      label: 'Punteggio medio',
      percentageValue: 60,
    },
    { mainValue: 300, subValue: 180, label: 'Idonei', percentageValue: 60 },
  ];

  sections: Section[] = [
    {
      id: 1,
      title: 'Assegnazioni',
      icon: this.UsersIcon,
      component: TestAssignments,
    },
    { id: 2, title: 'Statistiche', icon: this.ChartIcon, component: TestStats },
  ];
}
