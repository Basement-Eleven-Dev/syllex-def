import { Component, inject, signal } from '@angular/core';
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
  faBars,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { Auth } from '../../../services/auth';
import { TranslocoDirective } from '@jsverse/transloco';

export interface NavRoute {
  labelKey: string;
  icon: IconDefinition;
  route: string;
}

@Component({
  selector: 'app-nav',
  imports: [FontAwesomeModule, RouterModule, TranslocoDirective],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  private authService = inject(Auth);

  readonly LogoutIcon = faArrowRightFromBracket;
  readonly BarsIcon = faBars;
  readonly XmarkIcon = faXmark;

  menuOpen = signal(false);

  routes: NavRoute[] = [
    { labelKey: 'dashboard', icon: faHouse, route: '/s/dashboard' },
    {
      labelKey: 'communications',
      icon: faCalendar,
      route: '/s/comunicazioni',
    },
    { labelKey: 'resources', icon: faFile, route: '/s/risorse' },
    { labelKey: 'tests', icon: faFileLines, route: '/s/tests' },
    { labelKey: 'agents', icon: faRobot, route: '/s/agente' },
    { labelKey: 'profile', icon: faUser, route: '/s/profilo' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.closeMenu();
  }
}
