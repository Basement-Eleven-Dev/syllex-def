import { Injectable, inject } from '@angular/core';
import { MaterialiService, MaterialInterface } from './materiali-service';

interface RootFolderInterface extends MaterialInterface {
  _id: 'root';
  name: '/';
  type: 'folder';
}

/**
 * Gestisce la logica di drag-and-drop per materiali e cartelle
 */
@Injectable({ providedIn: 'root' })
export class MaterialeDragDropService {
  private materialiService = inject(MaterialiService);
  private draggedItem: MaterialInterface | null = null;
  private draggedItems: MaterialInterface[] = [];

  startDrag(item: MaterialInterface, selectedIds: Set<string>): void {
    if (selectedIds.has(item._id!) && selectedIds.size > 1) {
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

  handleDrop(targetItem: MaterialInterface | string): boolean {
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
    if (!this.canMoveItems(itemsToMove, targetFolder)) return false;

    // Sposta tutti gli elementi tramite una singola chiamata batch
    const itemIds = itemsToMove.map((item) => item._id!);
    this.materialiService.moveItems(itemIds, targetFolder._id!).subscribe({
      error: (err) => console.error('Errore durante lo spostamento:', err),
    });

    this.endDrag();
    return true;
  }

  private canMoveItems(
    items: MaterialInterface[],
    targetFolder: MaterialInterface,
  ): boolean {
    return items.every((item) => {
      if (item._id === targetFolder._id) return false;
      if (item.type === 'folder') {
        return !this.isDescendant(item, targetFolder);
      }
      return true;
    });
  }

  private resolveTargetFolder(
    targetItem: MaterialInterface | string,
  ): MaterialInterface | null {
    if (typeof targetItem === 'string') {
      if (targetItem === 'Home') {
        return {
          _id: 'root',
          name: '/',
          type: 'folder',
          content: this.materialiService.root(),
          createdAt: new Date(),
        } as RootFolderInterface;
      }
      return this.materialiService.getFolderFromName(targetItem);
    }

    return targetItem.type === 'folder' ? targetItem : null;
  }

  private isDescendant(
    parent: MaterialInterface,
    possibleChild: MaterialInterface,
  ): boolean {
    if (parent._id === possibleChild._id) return true;

    if (parent.type === 'folder' && parent.content) {
      return parent.content.some(
        (item) =>
          item.type === 'folder' && this.isDescendant(item, possibleChild),
      );
    }
    return false;
  }

  private getItemsByIds(ids: string[]): MaterialInterface[] {
    const items: MaterialInterface[] = [];

    const findItems = (searchItems: MaterialInterface[]): void => {
      for (const item of searchItems) {
        if (ids.includes(item._id!)) items.push(item);
        if (item.type === 'folder' && item.content) findItems(item.content);
      }
    };

    findItems(this.materialiService.root());
    return items;
  }
}
