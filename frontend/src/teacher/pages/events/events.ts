import { Component } from '@angular/core';
import { faPlus } from '../../../icons/wid';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { Calendario } from '../../components/calendario/calendario';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';

@Component({
  selector: 'app-events',
  imports: [
    FontAwesomeModule,
    RouterModule,
    Calendario,
    TourAnchorNgBootstrapDirective,
    SyllexPageHeader,
    SyllexButton,
  ],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  PlusIcon = faPlus;
}
