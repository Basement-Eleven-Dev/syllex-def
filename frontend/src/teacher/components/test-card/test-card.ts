import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  faBell,
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
import { TestInterface } from '../../../services/tests-service';
import { ClassiService } from '../../../services/classi-service';
import { ɵɵDir } from '@angular/cdk/scrolling';
import { SyllexBadge, SyllexBadgeColor } from '../UI/syllex-badge/syllex-badge';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { SyllexButton } from '../UI/syllex-button/syllex-button';

@Component({
  selector: 'app-test-card',
  imports: [
    DatePipe,
    FontAwesomeModule,
    TestContextualMenu,
    RouterModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    SyllexBadge,
    SyllexButton,
  ],
  templateUrl: './test-card.html',
  styleUrl: './test-card.scss',
})
export class TestCard {
  BackgroundIcon = faCheckDouble;
  BellIcon = faBell;
  ClockIcon = faClock;
  UsersIcon = faUsers;
  QuestionsIcon = faQuestionCircle;
  ThreeDotsIcon = faEllipsisVertical;
  CalendarIcon = faCalendar;

  @Input() test!: TestInterface;
  @Output() delete = new EventEmitter<string>();
  @Output() duplicate = new EventEmitter<string>();
  @Output() publish = new EventEmitter<string>();

  constructor(public classiService: ClassiService) {}

  getMaxScore(): number {
    if (!this.test.questions || this.test.questions.length === 0) {
      return 0;
    }
    return this.test.questions.reduce((total, q) => total + q.points, 0);
  }

  getBadgeColor(): SyllexBadgeColor {
    if (this.test.status === 'pubblicato') {
      return 'black';
    } else if (this.test.status === 'bozza') {
      return 'orange';
    } else if (this.test.status === 'archiviato') {
      return 'gray';
    }
    return 'gray';
  }
}
