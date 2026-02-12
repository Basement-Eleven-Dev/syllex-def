import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGrid, faList } from '@fortawesome/pro-solid-svg-icons';

export type ViewType = 'grid' | 'table';

@Component({
  selector: 'app-view-type-toggle',
  imports: [NgClass, FontAwesomeModule],
  templateUrl: './view-type-toggle.html',
  styleUrl: './view-type-toggle.scss',
})
export class ViewTypeToggle {
  readonly TableIcon = faList;
  readonly GridIcon = faGrid;

  viewType = input.required<ViewType>();
  viewTypeChange = output<ViewType>();

  onChangeViewType(type: ViewType): void {
    this.viewTypeChange.emit(type);
  }
}
