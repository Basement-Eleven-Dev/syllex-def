import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faFile,
  faFileLines,
  faHouse,
  faRobot,
  faUser,
  faArrowRightFromBracket,
} from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../services/auth';

export interface NavRoute {
  label: string;
  icon: IconDefinition;
  route: string;
}
@Component({
  selector: 'app-nav',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  private authService = inject(Auth);
  readonly LogoutIcon = faArrowRightFromBracket;
  routes: NavRoute[] = [
    { label: 'Dashboard', icon: faHouse, route: '/s/dashboard' },
    {
      label: 'Comunicazioni ed eventi',
      icon: faCalendar,
      route: '/s/comunicazioni',
    },
    { label: 'File e risorse', icon: faFile, route: '/s/risorse' },
    { label: 'Test', icon: faFileLines, route: '/s/tests' },
    { label: 'Agenti', icon: faRobot, route: '/s/agente' },
    { label: 'Profilo', icon: faUser, route: '/s/profilo' },
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
