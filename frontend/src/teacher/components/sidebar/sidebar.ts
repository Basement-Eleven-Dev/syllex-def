import {
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faArrowDownBigSmall,
  faBallotCheck,
  faBook,
  faBrainCircuit,
  faCalendarAlt,
  faChartLine,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faClipboardQuestion,
  faFile,
  faGauge,
  faGear,
  faHeadSideBrain,
  faMailboxOpenLetter,
  faPencil,
  faRightFromBracket,
  faSparkles,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { Auth } from '../../../services/auth';
import { FormsModule } from '@angular/forms';
import { Materia, MateriaObject } from '../../../services/materia';
import { SubjectSettingsModal } from '../subject-settings-modal/subject-settings-modal';
import { HelpChat } from '../help-chat/help-chat';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

interface SidebarRoute {
  path: string;
  label: string;
  icon: IconDefinition;
  tourAnchor?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    FontAwesomeModule,
    RouterModule,
    NgbCollapseModule,
    FormsModule,
    TourAnchorNgBootstrapDirective,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: { '[class.open]': 'open' },
})
export class Sidebar {
  @Input() open = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild(HelpChat) helpChatRef!: HelpChat;

  toggleHelpChat() {
    this.helpChatRef?.toggleChat();
  }
  onRequestSubjectSettings() {
    const modalRef = this.modalService.open(SubjectSettingsModal, {
      centered: true,
    });
  }
  LogoutIcon = faRightFromBracket;
  SparklesIcon = faSparkles;
  BookIcon = faBook;
  ChevronDownIcon = faChevronDown;
  ChevronLeftIcon = faChevronLeft;
  ChevronRightIcon = faChevronRight;
  ChevronUpIcon = faChevronUp;
  HeadSideBrainIcon = faHeadSideBrain;
  GearIcon = faGear;
  SubjectToggleIcon = faArrowDownBigSmall;
  faPencil = faPencil;

  isSubjectsCollapsed = signal(true);

  constructor(
    private authService: Auth,
    public materiaService: Materia,
    private modalService: NgbModal,
    private router: Router
  ) {}

  toggleSubjectsCollapse(): void {
    this.isSubjectsCollapsed.set(!this.isSubjectsCollapsed());
  }

  selectSubject(subject: MateriaObject): void {
    this.materiaService.setSelectedSubject(subject);
  }

  get selectedSubject(): MateriaObject | null {
    return this.materiaService.materiaSelected();
  }

  navigateToLabAi(): void {
    if (this.router.url === '/t/laboratorio-ai') {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/t/laboratorio-ai']);
      });
    } else {
      this.router.navigate(['/t/laboratorio-ai']);
    }
  }

  mainRoutes: SidebarRoute[] = [
    {
      path: 'dashboard',
      label: 'home',
      icon: faGauge,
    },
    {
      path: 'tests',
      label: 'tests',
      icon: faBallotCheck,
      tourAnchor: 'teacher-tests',
    },
    /*     {
      path: 'lessons',
      label: 'Lezioni',
      icon: faBook,
    }, */
    {
      path: 'banca',
      label: 'banca',
      icon: faClipboardQuestion,
      tourAnchor: 'teacher-banca',
    },
    {
      path: 'classi',
      label: 'classes',
      icon: faUsers,
    },
    {
      path: 'risorse',
      label: 'resources',
      icon: faFile,
    },
    {
      path: 'calendario',
      label: 'calendar',
      icon: faCalendarAlt,
    },
  ];

  availableSubjects = computed(() => {
    const selected = this.materiaService.materiaSelected();
    const allMaterie = this.materiaService.allMaterie();

    if (!selected) {
      return allMaterie;
    }

    // Exclude the currently selected subject from the list
    return allMaterie.filter((subject) => subject._id !== selected._id);
  });
}
