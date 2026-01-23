import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { faChartLine } from '@fortawesome/pro-solid-svg-icons';

interface SidebarRoute {
  path: string;
  label: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-sidebar',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  sidebarRoutes: SidebarRoute[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: faChartLine,
    },
  ];
}
