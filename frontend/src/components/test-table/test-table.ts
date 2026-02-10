import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical, faEye } from '@fortawesome/pro-solid-svg-icons';
import {
  NgbPagination,
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { TestInterface, TestsService } from '../../services/tests-service';
import { TestContextualMenu } from '../test-contextual-menu/test-contextual-menu';
import { RouterModule } from '@angular/router';
import { ClassiService } from '../../services/classi-service';

@Component({
  selector: 'app-test-table',
  imports: [
    TitleCasePipe,
    FontAwesomeModule,
    DatePipe,
    NgbPagination,
    CommonModule,
    FormsModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    TestContextualMenu,
    RouterModule,
  ],
  standalone: true,
  templateUrl: './test-table.html',
  styleUrl: './test-table.scss',
})
export class TestTable {
  EyeIcon = faEye;
  ThreeDotsIcon = faEllipsisVertical;

  @Input() tests: TestInterface[] = [];

  constructor(
    private testsService: TestsService,
    public classiService: ClassiService,
  ) {}

  getMaxScore(test: TestInterface): number {
    if (!test.questions || test.questions.length === 0) {
      return 0;
    }
    return test.questions.reduce((total, q) => total + q.points, 0);
  }
}
