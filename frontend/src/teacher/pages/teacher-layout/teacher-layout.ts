import {
  Component,
  signal,
  inject,
  effect,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import {
  TourAnchorNgBootstrapDirective,
  TourService,
  TourStepTemplateComponent,
} from 'ngx-ui-tour-ng-bootstrap';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { UserContextualMenu } from '../../components/user-contextual-menu/user-contextual-menu';
import {
  RouterOutlet,
  RouterModule,
  Router,
  NavigationEnd,
  NavigationStart,
} from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { Auth } from '../../../services/auth';
import { TERMS_VERSION } from '../../../app/_utils/terms-version';
import {
  faSpinnerThird,
  faUserCircle,
  faSignOutAlt,
  faBookOpen,
  faInfoCircle,
  faQuestionCircle,
  faGauge,
  faBallotCheck,
  faUsers,
  faFile,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { Materia } from '../../../services/materia';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../services/feedback-service';
import { dashboard_steps } from '../../../tours/tour_dashboard';
import { banca_domande_steps } from '../../../tours/tour_banca_domande';
import { assistente_ai_steps } from '../../../tours/tour_assistente_ai';
import { laboratorio_ai_steps } from '../../../tours/tour_laboratorio_ai';
import { materiali_steps } from '../../../tours/tour_materiali';
import { test_steps } from '../../../tours/tour_test';
import { comunicazioni_steps } from '../../../tours/tour_comunicazioni';
import { eventi_steps } from '../../../tours/tour_eventi';
import { crea_domanda_steps } from '../../../tours/tour_crea_domanda';

@Component({
  selector: 'app-teacher-layout',
  imports: [
    Sidebar,
    Nav,
    RouterOutlet,
    RouterModule,
    FontAwesomeModule,
    TourStepTemplateComponent,
    CommonModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    UserContextualMenu,
  ],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
})
export class TeacherLayout implements OnInit, OnDestroy {
  @ViewChild('sidebarRef') sidebarRef!: Sidebar;

  showLoading = signal<boolean>(false);
  hasTourForRoute = signal<boolean>(false);
  sidebarOpen = signal<boolean>(false);
  navHidden = signal<boolean>(false);
  isAgentRoute = signal<boolean>(false);
  hideBottomNavRoute = signal<boolean>(false);
  private lastScrollY = 0;

  GaugeIcon = faGauge;
  BallotCheckIcon = faBallotCheck;
  UsersIcon = faUsers;
  FileIcon = faFile;
  UserProfileIcon = faUserCircle;
  HelpIcon = faQuestionCircle;

  public materia = inject(Materia);
  private feedbackService = inject(FeedbackService);
  public tourService: TourService = inject(TourService) as TourService;
  private authService = inject(Auth);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  SpinnerIcon = faSpinnerThird;
  InfoIcon = faInfoCircle;

  constructor() {
    effect(() => {
      const selected = this.materia.materiaSelected();
      const shouldReload = this.materia.shouldReload();

      if (selected && shouldReload) {
        this.showLoading.set(true);
        this.materia.shouldReload.set(false);
        setTimeout(() => window.location.reload(), 2000);
      }
    });
  }

  private readonly TOUR_ROUTES = new Set([
    '/t/dashboard',
    '/t/banca',
    '/t/agente',
    '/t/laboratorio-ai',
    '/t/risorse',
    '/t/tests',
    '/t/comunicazioni',
    '/t/calendario',
    '/t/create-question',
  ]);

  ngOnInit() {
    this.hasTourForRoute.set(this.TOUR_ROUTES.has(window.location.pathname));
    const isAgent = window.location.pathname === '/t/agente';
    this.isAgentRoute.set(isAgent);
    this.hideBottomNavRoute.set(isAgent || window.location.pathname === '/t/laboratorio-ai' || window.location.pathname === '/t/create-question' || window.location.pathname.startsWith('/t/tests/new') || window.location.pathname.startsWith('/t/tests/edit'));

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationStart),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.closeSidebar();
      });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects.split('?')[0];
        this.hasTourForRoute.set(this.TOUR_ROUTES.has(url));
        const isAgent = url === '/t/agente';
        this.isAgentRoute.set(isAgent);
        this.hideBottomNavRoute.set(isAgent || url === '/t/laboratorio-ai' || url === '/t/create-question' || url.startsWith('/t/tests/new') || url.startsWith('/t/tests/edit'));
      });
    this.tourService.start$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.add('tour-active');
    });
    this.tourService.end$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.remove('tour-active');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.sidebarRef?.toggleHelpChat();
  }
  startTour() {
    const currentRoute = window.location.pathname;
    switch (currentRoute) {
      case '/t/dashboard':
        this.tourService.initialize(dashboard_steps);
        break;
      case '/t/banca':
        this.tourService.initialize(banca_domande_steps);
        break;
      case '/t/agente':
        this.tourService.initialize(assistente_ai_steps);
        break;
      case '/t/laboratorio-ai':
        this.tourService.initialize(laboratorio_ai_steps);
        break;
      case '/t/risorse':
        this.tourService.initialize(materiali_steps);
        break;
      case '/t/tests':
        this.tourService.initialize(test_steps);
        break;
      case '/t/comunicazioni':
        this.tourService.initialize(comunicazioni_steps);
        break;
      case '/t/calendario':
        this.tourService.initialize(eventi_steps);
        break;
      case '/t/create-question':
        this.tourService.initialize(crea_domanda_steps);
        break;
      default:
        this.tourService.initialize(dashboard_steps);
        break;
    }
    this.tourService.start();
  }
}
