import {
  Component,
  signal,
  ViewChild,
  HostListener,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUserCircle,
  faQuestionCircle,
  faHouse,
  faCalendar,
  faFile,
  faFileLines,
  faRobot,
  faXmark,
  faRightFromBracket,
  faGrip,
  faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { StudentSidebar } from '../../components/student-sidebar/student-sidebar';
import { StudentNav } from '../../components/student-nav/student-nav';
import { StudentUserContextualMenu } from '../../components/student-user-contextual-menu/student-user-contextual-menu';
import { HelpChat } from '../../../teacher/components/help-chat/help-chat';
import { Auth, User } from '../../../services/auth';
import { Materia } from '../../../services/materia';
import {
  SelectOption,
  SyllexSelectInput,
} from '../../../teacher/components/UI/syllex-select-input/syllex-select-input';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    StudentSidebar,
    StudentNav,
    StudentUserContextualMenu,
    HelpChat,
    SyllexSelectInput,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.scss',
})
export class StudentLayout implements OnInit {
  @ViewChild('sidebarRef') sidebarRef!: StudentSidebar;
  @ViewChild(HelpChat) helpChatRef!: HelpChat;

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly materiaService = inject(Materia);

  User = signal<User | null>(null);
  sidebarOpen = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);
  navHidden = signal<boolean>(false);
  isAgentRoute = signal<boolean>(false);
  private lastScrollY = 0;

  subjectOptions = computed<SelectOption[]>(() => {
    return this.materiaService.allMaterie().map((m) => ({
      value: m._id,
      label: m.name,
    }));
  });

  onSubjectChange(subjectId: string) {
    const subject = this.materiaService
      .allMaterie()
      .find((m) => m._id === subjectId);
    if (subject) {
      this.materiaService.setSelectedSubject(subject);
    }
  }

  UserProfileIcon = faUserCircle;
  HelpIcon = faQuestionCircle;
  HouseIcon = faHouse;
  CalendarIcon = faCalendar;
  FileIcon = faFile;
  TestIcon = faFileLines;
  SparklesIcon = faSparkles;
  XmarkIcon = faXmark;
  LogoutIcon = faRightFromBracket;
  GripIcon = faGrip;

  mainRoutes = [
    {
      path: 'dashboard',
      labelKey: 'home',
      icon: faHouse,
    },
    {
      path: 'tests',
      labelKey: 'tests',
      icon: faFileLines,
    },
    {
      path: 'risorse',
      labelKey: 'resources',
      icon: faFile,
    },
    {
      path: 'calendario',
      labelKey: 'calendar',
      icon: faCalendar,
    },
  ];

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => this.User.set(user));
    this.isAgentRoute.set(this.router.url.includes('/s/agente'));
    this.router.events.subscribe(() => {
      this.isAgentRoute.set(this.router.url.includes('/s/agente'));
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.auth.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentY = window.scrollY;
    const diff = currentY - this.lastScrollY;
    if (Math.abs(diff) < 5) return;
    this.navHidden.set(diff > 0 && currentY > 60);
    this.lastScrollY = currentY;
  }

  onContentScroll(event: Event) {
    const el = event.target as HTMLElement;
    const currentY = el.scrollTop;
    const diff = currentY - this.lastScrollY;
    if (Math.abs(diff) < 5) return;
    this.navHidden.set(diff > 0 && currentY > 60);
    this.lastScrollY = currentY;
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  openHelpChat() {
    this.helpChatRef?.toggleChat();
  }
}
