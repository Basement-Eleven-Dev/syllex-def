import { Injectable, inject } from '@angular/core';
import { Folder, Materiale, MaterialiService } from './materiali-service';

/**
 * Gestisce la logica di drag-and-drop per materiali e cartelle
 */
@Injectable({ providedIn: 'root' })
export class MaterialeDragDropService {
  private materialiService = inject(MaterialiService);
  private draggedItem: Folder | Materiale | null = null;
  private draggedItems: (Folder | Materiale)[] = [];

  startDrag(item: Folder | Materiale, selectedIds: Set<string>): void {
    if (selectedIds.has(item.id) && selectedIds.size > 1) {
      this.draggedItems = this.getItemsByIds(Array.from(selectedIds));
      this.draggedItem = null;
    } else {
      this.draggedItem = item;
      this.draggedItems = [];
    }
  }

  endDrag(): void {
    this.draggedItem = null;
    this.draggedItems = [];
  }

  handleDrop(
    targetItem: Folder | Materiale | string,
    currentRootId: string,
  ): boolean {
    const targetFolder = this.resolveTargetFolder(targetItem);
    if (!targetFolder) return false;

    const itemsToMove =
      this.draggedItems.length > 0
        ? this.draggedItems
        : this.draggedItem
          ? [this.draggedItem]
          : [];
    if (itemsToMove.length === 0) return false;

    // Verifica che nessun elemento sia la cartella target o un suo antenato
    for (const item of itemsToMove) {
      if (item.id === targetFolder.id) return false;
      if (
        'content' in item &&
        this.isDescendant(item as Folder, targetFolder)
      ) {
        return false;
      }
    }

    // Sposta tutti gli elementi
    for (const item of itemsToMove) {
      this.removeItemFromStructure(item.id);
      if (targetFolder.name === '/') {
        this.materialiService.root.push(item);
      } else {
        targetFolder.content.push(item);
      }

      this.materialiService.moveItem(item.id, targetFolder.id, currentRootId);
    }

    this.endDrag();
    return true;
  }

  private resolveTargetFolder(
    targetItem: Folder | Materiale | string,
  ): Folder | null {
    if (typeof targetItem === 'string') {
      if (targetItem === 'Home') {
        return {
          id: 'root',
          name: '/',
          content: this.materialiService.root,
          createdAt: new Date(),
        };
      }
      return this.materialiService.getFolderFromName(targetItem);
    }

    return 'content' in targetItem ? (targetItem as Folder) : null;
  }

  private removeItemFromStructure(itemId: string): boolean {
    const removeFromArray = (items: (Folder | Materiale)[]): boolean => {
      const index = items.findIndex((i) => i.id === itemId);
      if (index !== -1) {
        items.splice(index, 1);
        return true;
      }

      for (const item of items) {
        if ('content' in item) {
          if (removeFromArray(item.content)) return true;
        }
      }
      return false;
    };

    return removeFromArray(this.materialiService.root);
  }

  private isDescendant(parent: Folder, possibleChild: Folder): boolean {
    if (parent.id === possibleChild.id) return true;

    for (const item of parent.content) {
      if ('content' in item) {
        if (this.isDescendant(item as Folder, possibleChild)) return true;
      }
    }
    return false;
  }

  private getItemsByIds(ids: string[]): (Folder | Materiale)[] {
    const items: (Folder | Materiale)[] = [];

    const findItems = (searchItems: (Folder | Materiale)[]): void => {
      for (const item of searchItems) {
        if (ids.includes(item.id)) items.push(item);
        if ('content' in item) findItems((item as Folder).content);
      }
    };

    findItems(this.materialiService.root);
    return items;
  }
}
