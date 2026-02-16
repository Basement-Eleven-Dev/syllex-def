import { DatePipe } from '@angular/common';
import { Component, computed, effect } from '@angular/core';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faBallotCheck,
  faCheck,
  faPaperclip,
  faPlus,
  faQuestion,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { Calendario } from '../../components/calendario/calendario';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';
import { ClassiService } from '../../services/classi-service';
import { MaterialiService } from '../../services/materiali-service';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../services/comunicazioni-service';
import { Materia } from '../../services/materia';
import { TestsService } from '../../services/tests-service';

interface DashboardQuickLink {
  value: number | undefined;
  description: string;
  route: string;
  routeString: string;
  alert?: boolean;
  icon: IconDefinition;
}

interface DashboardAction {
  label: string;
  icon: IconDefinition;
  class: string;
  action: () => void;
}

@Component({
  selector: 'app-dashboard',
  imports: [FontAwesomeModule, DatePipe, Calendario, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  UsersIcon = faUsers;

  constructor(
    public authService: Auth,
    public classiService: ClassiService,
    public materialiService: MaterialiService,
    public comunicazioniService: ComunicazioniService,
    private testService: TestsService,
    public materiaService: Materia,
    private router: Router,
  ) {
    // Aggiorna reattivamente i quickLinks quando i dati dei service cambiano
    effect(() => {
      this.quickLinks[0].value = this.classiService.classi().length;
      this.quickLinks[3].value = this.materialiService.countFiles();
    });

    // Carica comunicazioni recenti quando viene selezionata una materia
    effect(() => {
      const selectedMateria = this.materiaService.materiaSelected();
      if (selectedMateria) {
        this.loadRecentCommunications();
        this.testService.countPublishedTests().subscribe((response) => {
          this.quickLinks[1].value = response.count;
        });
        this.testService.countAssignmentsToGrade().subscribe((response) => {
          this.quickLinks[2].value = response.count;
        });
      }
    });
  }
  AttachmentIcon = faPaperclip;
  quickLinks: DashboardQuickLink[] = [
    {
      value: undefined,
      description: 'Classi',
      route: '/classi',
      routeString: 'Vai alle Classi',
      icon: faUsers,
    },
    {
      value: undefined,
      description: 'Test pubblicati',
      route: '/test-pubblicati',
      routeString: 'Vai ai test pubblicati',
      icon: faBallotCheck,
    },
    {
      value: undefined,
      description: 'Consegne da correggere',
      route: '/assignments',
      routeString: 'Vai alle consegne da correggere',
      alert: true,
      icon: faCheck,
    },
    {
      value: undefined,
      description: 'Materiali',
      route: '/materiali',
      routeString: 'Vai ai materiali',
      icon: faPaperclip,
    },
  ];

  quickActions: DashboardAction[] = [
    {
      label: 'Crea nuovo test',
      icon: faPlus,
      class: 'primary',
      action: () => {
        this.router.navigateByUrl('/t/tests/new');
      },
    },
    {
      label: 'Crea nuova domanda',
      icon: faQuestion,
      class: 'primary',
      action: () => {
        this.router.navigateByUrl('/t/create-question');
      },
    },
    {
      label: 'Carica materiali',
      icon: faPaperclip,
      class: 'primary',
      action: () => {
        this.router.navigateByUrl('/t/risorse');
      },
    },
    {
      label: 'Da correggere (3)',
      icon: faCheck,
      class: 'warning',
      action: () => {
        console.log('Schedule Exam action triggered');
      },
    },
  ];

  communications: ComunicazioneInterface[] = [];

  loadRecentCommunications() {
    this.comunicazioniService
      .getPagedComunicazioni('', '', '', 1, 5)
      .subscribe((response) => {
        this.communications = response.communications;
      });
  }
}
