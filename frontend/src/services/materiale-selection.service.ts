import { Injectable, signal } from '@angular/core';

/**
 * Gestisce la selezione multipla degli elementi
 */
@Injectable({ providedIn: 'root' })
export class MaterialeSelectionService {
  selectedIds = signal<Set<string>>(new Set());

  toggle(itemId: string, multiSelect: boolean = false): void {
    const current = new Set(this.selectedIds());

    if (multiSelect) {
      if (current.has(itemId)) {
        current.delete(itemId);
      } else {
        current.add(itemId);
      }
    } else {
      if (current.has(itemId) && current.size === 1) {
        current.clear();
      } else {
        current.clear();
        current.add(itemId);
      }
    }

    this.selectedIds.set(current);
  }

  isSelected(itemId: string): boolean {
    return this.selectedIds().has(itemId);
  }

  clear(): void {
    this.selectedIds.set(new Set());
  }

  getSelection(): Set<string> {
    return this.selectedIds();
  }
}
