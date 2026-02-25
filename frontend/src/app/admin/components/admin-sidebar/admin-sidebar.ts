import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
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
  routes: AdminNavRoute[] = [
    { label: 'Dashboard', icon: faHouse, route: '/a/dashboard' },
    { label: 'Onboarding', icon: faSparkles, route: '/a/onboarding' },
    {
      label: 'Organizzazioni',
      icon: faLandmark,
      route: '/a/organizzazioni',
    },
  ];
}
