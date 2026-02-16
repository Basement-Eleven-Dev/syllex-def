import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faFileLines,
  faHouse,
  faRobot,
  faUser,
} from '@fortawesome/pro-solid-svg-icons';

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
  routes: NavRoute[] = [
    { label: 'Home', icon: faHouse, route: '/s/home' },
    { label: 'Correzioni', icon: faFileLines, route: '/s/correzioni' },
    { label: 'Agenti', icon: faRobot, route: '/s/agenti' },
    { label: 'Profilo', icon: faUser, route: '/s/profile' },
  ];
}
