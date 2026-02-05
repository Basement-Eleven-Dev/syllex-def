import { Component, input, model, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';

export interface TypeOption {
  label: string;
  value: string;
  icon: IconDefinition;
  description?: string;
}

export type LayoutDirection = 'row' | 'column';
export type CardSize = 'default' | 'small';

@Component({
  selector: 'app-type-selector',
  imports: [FontAwesomeModule],
  templateUrl: './type-selector.html',
  styleUrl: './type-selector.scss',
})
export class TypeSelector {
  /**
   * Array di opzioni disponibili per la selezione
   */
  options = input.required<TypeOption[]>();

  /**
   * Valore attualmente selezionato (two-way binding via signal)
   */
  selectedValue = model.required<string>();

  /**
   * Layout delle card: row (griglia) o column (fila orizzontale)
   */
  direction = input<LayoutDirection>('row');

  /**
   * Dimensione delle card: default (con label) o small (solo icona)
   */
  size = input<CardSize>('default');

  /**
   * Se true, mostra anche la descrizione nelle card (solo per size='default')
   */
  showDescription = input<boolean>(false);

  /**
   * Emette il valore selezionato quando cambia
   */
  typeSelected = output<string>();

  onSelectType(value: string): void {
    this.selectedValue.set(value);
    this.typeSelected.emit(value);
  }
}
