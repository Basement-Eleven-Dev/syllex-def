import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { faArrowRight } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-syllex-card',
  standalone: true,
  imports: [NgClass, FontAwesomeModule, RouterLink],
  templateUrl: './syllex-card.html',
  styleUrl: './syllex-card.scss',
})
export class SyllexCard {
  @Input() title!: string;
  @Input() description?: string;
  @Input() icon?: IconDefinition;
  @Input() variant: 'filled' | 'outline' | 'ai' = 'filled';
  @Input() color: 'primary' | 'blue' | 'purple' | 'green' | 'warning' | 'danger' = 'primary';
  @Input() link?: string;
  @Input() target: string = '_self';
  @Input() showArrow: boolean = true;
  @Input() class: string = '';

  faArrowRight = faArrowRight;

  get cardClasses() {
    return {
      [`variant-${this.variant}`]: true,
      [`color-${this.color}`]: true,
      'is-clickable': !!this.link,
      [this.class]: !!this.class
    };
  }
}
