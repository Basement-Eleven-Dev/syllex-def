import { Component, Input } from '@angular/core';
import { TestData } from '../../pages/test/test';
import { DatePipe, NgClass } from '@angular/common';
import {
  faCheckDouble,
  faClock,
  faEllipsisH,
  faEllipsisVertical,
  faQuestionCircle,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TestContextualMenu } from '../test-contextual-menu/test-contextual-menu';
import { RouterModule } from '@angular/router';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-test-card',
  imports: [
    DatePipe,
    FontAwesomeModule,
    NgClass,
    TestContextualMenu,
    RouterModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
  ],
  templateUrl: './test-card.html',
  styleUrl: './test-card.scss',
})
export class TestCard {
  BackgroundIcon = faCheckDouble;
  ClockIcon = faClock;
  UsersIcon = faUsers;
  QuestionsIcon = faQuestionCircle;
  ThreeDotsIcon = faEllipsisVertical;

  @Input() test!: TestData;
}
