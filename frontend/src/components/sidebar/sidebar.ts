import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faBallotCheck,
  faBook,
  faChartLine,
  faChevronDown,
  faChevronUp,
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
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { Materia, MateriaObject } from '../../services/materia';

interface SidebarRoute {
  path: string;
  label: string;
  icon: IconDefinition;
}

interface Subject {
  id: string;
  name: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [FontAwesomeModule, RouterModule, NgbCollapseModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  LogoutIcon = faRightFromBracket;
  SparklesIcon = faSparkles;
  BookIcon = faBook;
  ChevronDownIcon = faChevronDown;
  ChevronUpIcon = faChevronUp;

  isSubjectsCollapsed = signal(true);

  constructor(
    private authService: Auth,
    public materiaService: Materia,
  ) {}

  toggleSubjectsCollapse(): void {
    this.isSubjectsCollapsed.set(!this.isSubjectsCollapsed());
  }

  selectSubject(subject: MateriaObject): void {
    this.materiaService.switchMateria(subject);
  }

  get selectedSubject(): MateriaObject {
    return this.materiaService.materiaSelected.value!;
  }

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
