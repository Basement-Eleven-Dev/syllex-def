import { Injectable, inject } from '@angular/core';
import { MaterialiService, MaterialInterface } from './materiali-service';

/**
 * Gestisce la ricerca e navigazione nei materiali
 */
@Injectable({ providedIn: 'root' })
export class MaterialeSearchService {
  private materialiService = inject(MaterialiService);

  search(
    term: string,
    items: MaterialInterface[],
  ): { item: MaterialInterface; parentPath: MaterialInterface[] } | null {
    const lowerTerm = term.toLowerCase();
    return this.searchRecursive(lowerTerm, items, []);
  }

  private searchRecursive(
    lowerTerm: string,
    items: MaterialInterface[],
    parentPath: MaterialInterface[],
  ): { item: MaterialInterface; parentPath: MaterialInterface[] } | null {
    // Cerca nei nomi degli item correnti
    for (const item of items) {
      if (item.name.toLowerCase().includes(lowerTerm)) {
        return { item, parentPath };
      }
    }

    // Ricerca ricorsiva nelle sottocartelle
    for (const item of items) {
      if (item.type === 'folder' && item.content) {
        const result = this.searchRecursive(lowerTerm, item.content, [
          ...parentPath,
          item,
        ]);
        if (result) return result;
      }
    }

    return null;
  }

  getRootFolder(): MaterialInterface {
    return {
      _id: 'root',
      name: '/',
      type: 'folder',
      content: this.materialiService.root(),
      createdAt: new Date(),
    };
  }
}
