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
import { Auth } from '../../../services/auth';
import { ClassiService } from '../../../services/classi-service';
import { MaterialiService } from '../../../services/materiali-service';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';
import { Materia } from '../../../services/materia';
import { TestsService } from '../../../services/tests-service';

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
    // Carica comunicazioni recenti quando viene selezionata una materia
    effect(() => {
      const selectedMateria = this.materiaService.materiaSelected();
      if (selectedMateria) {
        this.loadRecentCommunications();
        this.testService.countAssignmentsToGrade().subscribe((response) => {
          this.quickActions[3].label += ` (${response.count})`;
        });
      }
    });
  }
  AttachmentIcon = faPaperclip;

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
      label: 'Da correggere ',
      icon: faCheck,
      class: 'warning',
      action: () => {
        this.router.navigateByUrl('/t/tests');
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
