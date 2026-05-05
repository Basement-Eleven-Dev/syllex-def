import {
  Component,
  signal,
  inject,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  TourAnchorNgBootstrapDirective,
  TourService,
  TourStepTemplateComponent,
} from 'ngx-ui-tour-ng-bootstrap';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { HelpChat } from '../../components/help-chat/help-chat';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
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
} from '@fortawesome/pro-solid-svg-icons';
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
    HelpChat,
    RouterOutlet,
    FontAwesomeModule,
    TourStepTemplateComponent,
    CommonModule,
  ],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
})
export class TeacherLayout implements OnInit, OnDestroy {
  showLoading = signal<boolean>(false);
  hasTourForRoute = signal<boolean>(false);
  public materia = inject(Materia);
  private feedbackService = inject(FeedbackService);
  public tourService: TourService = inject(TourService) as TourService;
  private authService = inject(Auth);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  SpinnerIcon = faSpinnerThird;
  UserProfileIcon = faUserCircle;
  InfoIcon = faInfoCircle;
  questionMarkIcon = faQuestionCircle;

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
    '/t/eventi',
    '/t/create-question',
  ]);

  ngOnInit() {
    this.hasTourForRoute.set(this.TOUR_ROUTES.has(window.location.pathname));

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects.split('?')[0];
        this.hasTourForRoute.set(this.TOUR_ROUTES.has(url));
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
      case '/t/eventi':
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
