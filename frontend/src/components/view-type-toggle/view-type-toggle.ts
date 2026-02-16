import { Component, input, output, effect } from '@angular/core';
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
  private readonly STORAGE_KEY_PREFIX = 'viewType_';

  readonly TableIcon = faList;
  readonly GridIcon = faGrid;

  viewType = input.required<ViewType>();
  pageKey = input<string>('default');
  viewTypeChange = output<ViewType>();

  constructor() {
    // Carica la preferenza salvata quando il componente viene inizializzato
    effect(
      () => {
        const key = this.pageKey();
        const savedViewType = this.loadViewTypePreference(key);
        if (savedViewType && savedViewType !== this.viewType()) {
          // Emetti il valore salvato per aggiornare il parent
          this.viewTypeChange.emit(savedViewType);
        }
      },
      { allowSignalWrites: false },
    );
  }

  onChangeViewType(type: ViewType): void {
    const key = this.pageKey();
    this.saveViewTypePreference(key, type);
    this.viewTypeChange.emit(type);
  }

  private saveViewTypePreference(pageKey: string, viewType: ViewType): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${pageKey}`, viewType);
    } catch (error) {
      console.error(
        'Errore durante il salvataggio della preferenza di visualizzazione:',
        error,
      );
    }
  }

  private loadViewTypePreference(pageKey: string): ViewType | null {
    try {
      const saved = localStorage.getItem(
        `${this.STORAGE_KEY_PREFIX}${pageKey}`,
      );
      return saved === 'grid' || saved === 'table' ? saved : null;
    } catch (error) {
      console.error(
        'Errore durante il caricamento della preferenza di visualizzazione:',
        error,
      );
      return null;
    }
  }
}
