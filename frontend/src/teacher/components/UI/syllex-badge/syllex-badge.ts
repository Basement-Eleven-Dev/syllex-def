import { Component, Input } from '@angular/core';

export type SyllexBadgeColor =
  | 'green'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'red'
  | 'gray';

const COLOR_CLASSES: Record<SyllexBadgeColor, string> = {
  green: 'badge-syllex-green',
  orange: 'badge-syllex-orange',
  blue: 'badge-syllex-blue',
  purple: 'badge-syllex-purple',
  red: 'badge-syllex-red',
  gray: 'badge-syllex-gray',
};

@Component({
  selector: 'app-syllex-badge',
  standalone: true,
  template: `<span class="badge badge-syllex {{ colorClass }}">{{
    label
  }}</span>`,
  styleUrl: './syllex-badge.scss',
  host: { style: 'display: inline-block' },
})
export class SyllexBadge {
  @Input({ required: true }) label!: string;
  @Input() color: SyllexBadgeColor = 'blue';

  get colorClass() {
    return COLOR_CLASSES[this.color];
  }
}
