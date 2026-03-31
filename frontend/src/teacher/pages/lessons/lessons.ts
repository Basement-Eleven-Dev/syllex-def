import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-lessons',
  imports: [FontAwesomeModule],
  templateUrl: './lessons.html',
  styleUrl: './lessons.scss',
})
export class Lessons {
  readonly PlusIcon = faPlus;
}
