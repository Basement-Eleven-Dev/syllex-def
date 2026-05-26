import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface TabFilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-syllex-tab-filter',
  imports: [],
  templateUrl: './syllex-tab-filter.html',
  styleUrl: './syllex-tab-filter.scss',
  host: { style: 'display: block' },
})
export class SyllexTabFilter {
  @Input() options: TabFilterOption[] = [];
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  select(val: string): void {
    this.valueChange.emit(val);
  }
}
