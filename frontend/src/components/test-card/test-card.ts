import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
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
import { TestInterface } from '../../services/tests-service';
import { ClassiService } from '../../services/classi-service';
import { ɵɵDir } from '@angular/cdk/scrolling';

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
    ɵɵDir,
    TitleCasePipe,
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

  @Input() test!: TestInterface;
  @Output() delete = new EventEmitter<string>();

  constructor(public classiService: ClassiService) {}

  getMaxScore(): number {
    if (!this.test.questions || this.test.questions.length === 0) {
      return 0;
    }
    return this.test.questions.reduce((total, q) => total + q.points, 0);
  }
}
