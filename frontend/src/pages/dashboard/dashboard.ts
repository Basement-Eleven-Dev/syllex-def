import { DatePipe } from '@angular/common';
import { Component, computed, effect } from '@angular/core';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { faPaperclip, faPlus, faUsers } from '@fortawesome/pro-solid-svg-icons';
import { Calendario } from '../../components/calendario/calendario';
import { RouterModule } from '@angular/router';
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
}

interface DashboardAction {
  label: string;
  icon: IconDefinition;
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
    },
    {
      value: undefined,
      description: 'Test pubblicati',
      route: '/test-pubblicati',
      routeString: 'Vai ai test pubblicati',
    },
    {
      value: undefined,
      description: 'Consegne da correggere',
      route: '/assignments',
      routeString: 'Vai alle consegne da correggere',
      alert: true,
    },
    {
      value: undefined,
      description: 'Materiali',
      route: '/materiali',
      routeString: 'Vai ai materiali',
    },
  ];

  quickActions: DashboardAction[] = [
    {
      label: 'Add New Student',
      icon: faPlus,
      action: () => {
        console.log('Add New Student action triggered');
      },
    },
    {
      label: 'Create Course',
      icon: faPlus,
      action: () => {
        console.log('Create Course action triggered');
      },
    },
    {
      label: 'Schedule Exam',
      icon: faPlus,
      action: () => {
        console.log('Schedule Exam action triggered');
      },
    },
    {
      label: 'Schedule Exam',
      icon: faPlus,
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
