import { Component, Input } from '@angular/core';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'fa-stacked-icon',
  imports: [FontAwesomeModule],
  standalone: true,
  templateUrl: './stacked-icon.html',
  styleUrl: './stacked-icon.scss',
})
export class StackedIcon {
  @Input() primary!: IconDefinition;
  @Input() secondary!: IconDefinition;
  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' =
    'top-right';
  get transformString() {
    return (
      {
        'top-left': 'up-8 left-8',
        'top-right': 'up-8 right-8',
        'bottom-left': 'down-8 left-8',
        'bottom-right': 'down-8 right-8',
      }[this.position] + ' shrink-8'
    );
  }
}
