import { Component } from '@angular/core';
import { faPlus } from '../../../icons/wid';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { Calendario } from '../../components/calendario/calendario';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';

@Component({
  selector: 'app-events',
  imports: [
    FontAwesomeModule,
    RouterModule,
    Calendario,
    TourAnchorNgBootstrapDirective,
  ],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  PlusIcon = faPlus;
}
