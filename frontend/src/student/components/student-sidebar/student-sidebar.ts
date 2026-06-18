import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
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
import { TranslocoDirective } from '@jsverse/transloco';

interface SidebarRoute {
  path: string;
  labelKey: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-student-sidebar',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, TranslocoDirective],
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
    private router: Router,
  ) {}

  mainRoutes: SidebarRoute[] = [
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

  navigateToLabAi(): void {
    this.router.navigate(['/s/laboratorio-ai']);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
