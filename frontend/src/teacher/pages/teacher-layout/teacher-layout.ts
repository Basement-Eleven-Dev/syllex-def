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
import { RouterOutlet } from '@angular/router';
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
} from '@fortawesome/pro-solid-svg-icons';
import { Materia } from '../../../services/materia';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-teacher-layout',
  imports: [
    Sidebar,
    Nav,
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
  public materia = inject(Materia);
  private feedbackService = inject(FeedbackService);
  public tourService: TourService = inject(TourService) as TourService;
  private authService = inject(Auth);
  private destroy$ = new Subject<void>();

  SpinnerIcon = faSpinnerThird;
  UserProfileIcon = faUserCircle;
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

  ngOnInit() {
    this.tourService.start$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.add('tour-active');
    });
    this.tourService.end$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.remove('tour-active');
      localStorage.setItem('syllex_teacher_tour_completed', 'true');
    });
    this.tourService.initialize([
      {
        anchorId: 'teacher-subject-select',
        title: 'Materia Corrente',
        content:
          'Tutto ciò che vedi è filtrato per la materia selezionata. Clicca qui per cambiarla.',
        placement: 'right',
        route: '/t/dashboard',
      },
      {
        anchorId: 'teacher-banca',
        title: 'Banca Domande',
        content:
          'Organizza il tuo archivio personale di domande da riutilizzare ai test o nelle esercitazioni libere della classe.',
        placement: 'right',
        route: '/t/banca',
      },
      {
        anchorId: 'teacher-tests',
        title: 'Test',
        content:
          "Crea e correggi compiti in classe o esercitazioni. Sfrutta l'AI per generare domande al volo o pescale dalla tua Banca.",
        placement: 'right',
        route: '/t/tests',
      },
      {
        anchorId: 'teacher-agent',
        title: 'Agente AI',
        content:
          'Il tuo assistente personale: un Agente esperto della tua materia pronto ad aiutarti a preparare lezioni e materiali.',
        placement: 'right',
        route: '/t/agente',
      },
      {
        anchorId: 'teacher-ai-lab',
        title: 'Laboratorio AI',
        content:
          "Sperimenta con strumenti avanzati basati sull'AI per creare contenuti didattici interattivi.",
        placement: 'right',
        route: '/t/laboratorio-ai',
      },
      {
        anchorId: 'teacher-profile',
        title: 'Profilo Docente',
        content:
          'Da qui puoi accedere alle tue impostazioni, calendario o segnalare un problema.',
        placement: 'bottom',
      },
    ]);

    if (!localStorage.getItem('syllex_teacher_tour_completed')) {
      this.authService.user$
        .pipe(
          filter(
            (user) =>
              !!user && user.termsAcceptation?.version === TERMS_VERSION,
          ),
          take(1),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          setTimeout(() => this.tourService.start(), 500);
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
