import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faBallotCheck,
  faBook,
  faChartLine,
  faClipboardQuestion,
  faFile,
  faGauge,
  faGear,
  faMailboxOpenLetter,
  faMicrochipAi,
  faRightFromBracket,
  faSparkles,
  faUserCircle,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../services/auth';

interface SidebarRoute {
  path: string;
  label: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-sidebar',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  LogoutIcon = faRightFromBracket;
  SparklesIcon = faSparkles;
  BookIcon = faBook;

  constructor(private authService: Auth) {}

  mainRoutes: SidebarRoute[] = [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: faGauge,
    },
    {
      path: 'materiali',
      label: 'Materiali',
      icon: faFile,
    },
    {
      path: 'tests',
      label: 'Tests',
      icon: faBallotCheck,
    },
    {
      path: 'classi',
      label: 'Classi',
      icon: faUsers,
    },
    {
      path: 'banca',
      label: 'Banca Domande',
      icon: faClipboardQuestion,
    },
    {
      path: 'comunicazioni',
      label: 'Comunicazioni',
      icon: faMailboxOpenLetter,
    },
  ];
}
