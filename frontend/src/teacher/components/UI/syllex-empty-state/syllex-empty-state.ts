import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { SyllexButton } from '../syllex-button/syllex-button';

@Component({
  selector: 'app-syllex-empty-state',
  imports: [CommonModule, FontAwesomeModule, SyllexButton],
  templateUrl: './syllex-empty-state.html',
  styleUrl: './syllex-empty-state.scss',
})
export class SyllexEmptyState {
  @Input() title!: string;
  @Input() description!: string;
  @Input() icon?: IconDefinition;
  
  @Input() actionLabel?: string;
  @Input() actionLink?: string;
  @Input() actionIcon?: IconDefinition;
  @Input() actionColor: 'primary' | 'celestine' | 'black' = 'primary';
  
  @Input() secondaryActionLabel?: string;
  @Input() secondaryActionLink?: string;
  @Input() secondaryActionIcon?: IconDefinition;

  @Output() actionClicked = new EventEmitter<void>();
  @Output() secondaryActionClicked = new EventEmitter<void>();

  onActionClick(): void {
    this.actionClicked.emit();
  }

  onSecondaryActionClick(): void {
    this.secondaryActionClicked.emit();
  }
}
