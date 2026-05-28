import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import {
  faHouse,
  faCalendar,
  faFile,
  faFileLines,
  faRobot,
  faUser,
  faRightFromBracket,
  faSparkles,
  faHeadSideBrain,
} from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../services/auth';

interface SidebarRoute {
  path: string;
  label: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-student-sidebar',
  standalone: true,
  imports: [
    FontAwesomeModule,
    RouterModule,
  ],
  templateUrl: './student-sidebar.html',
  styleUrl: './student-sidebar.scss',
  host: { '[class.open]': 'open' },
})
export class StudentSidebar {
  @Input() open = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  LogoutIcon = faRightFromBracket;
  SparklesIcon = faSparkles;
  HeadSideBrainIcon = faHeadSideBrain;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  mainRoutes: SidebarRoute[] = [
    {
      path: 'dashboard',
      label: 'Home',
      icon: faHouse,
    },
    {
      path: 'comunicazioni',
      label: 'Comunicazioni',
      icon: faCalendar,
    },
    {
      path: 'risorse',
      label: 'File e Risorse',
      icon: faFile,
    },
    {
      path: 'tests',
      label: 'Test',
      icon: faFileLines,
    },
  ];

  navigateToLabAi(): void {
    this.router.navigate(['/s/laboratorio-ai']);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
