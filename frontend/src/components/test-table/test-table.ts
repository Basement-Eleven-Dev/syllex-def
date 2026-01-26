import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestData } from '../../pages/test/test';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical, faEye } from '@fortawesome/pro-solid-svg-icons';
import { NgbPagination, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { TestsService } from '../../services/tests-service';
import { TestContextualMenu } from '../test-contextual-menu/test-contextual-menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-table',
  imports: [
    TitleCasePipe,
    FontAwesomeModule,
    DatePipe,
    NgbPagination,
    CommonModule,
    FormsModule,
    NgbPopover,
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

  @Input() tests: TestData[] = [];

  constructor(private testsService: TestsService) {}

  onMenuAction(action: string, test: TestData) {
    console.log(`Action "${action}" triggered for test:`, test);
    // Implement action handling logic here
  }
}
