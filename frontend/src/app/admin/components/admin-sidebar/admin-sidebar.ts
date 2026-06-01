import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Auth } from '../../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faHouse,
  faUserTie,
  faBook,
  faUsers,
  faLandmark,
  faUser,
  faSparkles,
  faCirclePlay,
  faChartBar,
  faBug,
} from '@fortawesome/pro-solid-svg-icons';

interface AdminNavRoute {
  label: string;
  icon: IconDefinition;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private auth = inject(Auth);

  private rawRoutes: AdminNavRoute[] = [
    { label: 'Dashboard', icon: faHouse, route: '/a/dashboard' },
    { label: 'Onboarding', icon: faCirclePlay, route: '/a/onboarding' },
    {
      label: 'Organizzazioni',
      icon: faLandmark,
      route: '/a/organizzazioni',
    },
    { label: 'Statistiche', icon: faChartBar, route: '/a/stats' },
    { label: 'Knowledge Source', icon: faBook, route: '/a/knowledge-source' },
    { label: 'Segnalazioni Bug', icon: faBug, route: '/a/reports' },
  ];

  get routes(): AdminNavRoute[] {
    if (this.auth.isSuperAdmin) {
      return this.rawRoutes;
    }

    const orgId = this.auth.user?.organizationId || this.auth.user?.organizationIds?.[0];

    return this.rawRoutes
      .filter(r => r.route !== '/a/onboarding')
      .map(r => {
        if (r.route === '/a/organizzazioni') {
          return {
            ...r,
            label: 'Organizzazione',
            route: `/a/organizzazioni/${orgId}`
          };
        }
        return r;
      });
  }
}
