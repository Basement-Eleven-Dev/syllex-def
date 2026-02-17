import { Component } from '@angular/core';
import { StudentTestsList } from '../student-tests-list/student-tests-list';

@Component({
  selector: 'app-student-test-execution',
  imports: [StudentTestsList],
  templateUrl: './student-test-execution.html',
  styleUrl: './student-test-execution.scss',
})
export class StudentTestExecution {}
