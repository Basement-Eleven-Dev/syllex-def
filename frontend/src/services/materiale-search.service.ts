import { Injectable, inject } from '@angular/core';
import { Folder, Materiale, MaterialiService } from './materiali-service';

/**
 * Gestisce la ricerca e navigazione nei materiali
 */
@Injectable({ providedIn: 'root' })
export class MaterialeSearchService {
  private materialiService = inject(MaterialiService);

  search(
    term: string,
    items: (Folder | Materiale)[],
  ): { item: Folder | Materiale; parentPath: Folder[] } | null {
    const lowerTerm = term.toLowerCase();

    // Cerca il miglior match nei nomi
    for (const item of items) {
      if (item.name.toLowerCase().includes(lowerTerm)) {
        return { item, parentPath: [] };
      }
    }

    // Ricerca ricorsiva nelle sottocartelle
    for (const item of items) {
      if ('content' in item) {
        const folder = item as Folder;
        const result = this.searchInFolder(term, folder.content, [folder]);
        if (result) return result;
      }
    }

    return null;
  }

  private searchInFolder(
    term: string,
    items: (Folder | Materiale)[],
    parentPath: Folder[],
  ): { item: Folder | Materiale; parentPath: Folder[] } | null {
    const lowerTerm = term.toLowerCase();

    for (const item of items) {
      if (item.name.toLowerCase().includes(lowerTerm)) {
        return { item, parentPath };
      }
    }

    for (const item of items) {
      if ('content' in item) {
        const folder = item as Folder;
        const result = this.searchInFolder(term, folder.content, [
          ...parentPath,
          folder,
        ]);
        if (result) return result;
      }
    }

    return null;
  }

  getRootFolder(): Folder {
    return {
      id: 'root',
      name: '/',
      content: this.materialiService.root,
      createdAt: new Date(),
    };
  }
}
