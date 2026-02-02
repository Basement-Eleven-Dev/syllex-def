import { Component, computed, inject, output, signal } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { MaterialiService } from '../../services/materiali-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { getFileIcon, getFolderIcon } from '../../app/_utils/file-icons';
import { FormsModule } from '@angular/forms';
import { MaterialiItemComponent } from './materiali-item.component';

interface Materiale {
  id: string;
  filename: string;
  url: string;
  extension: string;
}

interface Folder {
  id: string;
  name: string;
  content: (Materiale | Folder)[];
}

@Component({
  selector: 'app-materiali-selector',
  imports: [
    NgbCollapse,
    FontAwesomeModule,
    FormsModule,
    MaterialiItemComponent,
  ],
  templateUrl: './materiali-selector.html',
  styleUrl: './materiali-selector.scss',
})
export class MaterialiSelector {
  private materialiService = inject(MaterialiService);

  items = this.materialiService.root;
  expandedFolders = signal<Set<string>>(new Set());
  selectedMaterialIds = signal<Set<string>>(new Set());
  searchQuery = signal<string>('');

  chevronIcon = faChevronRight;

  materialsSelected = output<Materiale[]>();

  // Computed per ottenere gli oggetti materiali selezionati
  selectedMaterials = computed(() => {
    const selectedIds = this.selectedMaterialIds();
    const materials: Materiale[] = [];

    const collectMaterials = (items: (Folder | Materiale)[]) => {
      items.forEach((item) => {
        if (this.isFolder(item)) {
          collectMaterials(item.content);
        } else if (selectedIds.has(item.id)) {
          materials.push(item);
        }
      });
    };

    collectMaterials(this.items);
    return materials;
  });

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.items;

    const foldersToExpand = new Set<string>();

    // Funzione ricorsiva per verificare se un item o i suoi discendenti matchano
    const hasMatch = (
      item: Folder | Materiale,
      folderPath: string[] = [],
    ): boolean => {
      if (this.isFolder(item)) {
        const folderMatch = item.name.toLowerCase().includes(query);
        const currentPath = [...folderPath, item.id];

        // Verifica match nei contenuti
        const contentHasMatch = item.content.some((child) => {
          const childMatch = hasMatch(child, currentPath);
          return childMatch;
        });

        // Se c'è un match nel contenuto, espandi questa folder e tutti i parent
        if (contentHasMatch) {
          currentPath.forEach((folderId) => foldersToExpand.add(folderId));
        }

        return folderMatch || contentHasMatch;
      }
      return item.filename.toLowerCase().includes(query);
    };

    const filtered = this.items.filter((item) => hasMatch(item));

    // Aggiorna le folder espanse
    if (foldersToExpand.size > 0) {
      this.expandedFolders.set(foldersToExpand);
    }

    return filtered;
  });

  isFolder(item: Folder | Materiale): item is Folder {
    return 'content' in item;
  }

  toggleFolder(folderId: string): void {
    const expanded = this.expandedFolders();
    const newSet = new Set(expanded);

    if (newSet.has(folderId)) {
      newSet.delete(folderId);
    } else {
      newSet.add(folderId);
    }

    this.expandedFolders.set(newSet);
  }

  isFolderExpanded(folderId: string): boolean {
    return this.expandedFolders().has(folderId);
  }

  selectMaterial(materiale: Materiale, event?: MouseEvent): void {
    const selectedIds = this.selectedMaterialIds();
    const newSet = new Set(selectedIds);

    // Ctrl/Cmd per selezione multipla
    if (event?.ctrlKey || event?.metaKey) {
      if (newSet.has(materiale.id)) {
        newSet.delete(materiale.id);
      } else {
        newSet.add(materiale.id);
      }
    } else {
      // Click singolo: toggle se già selezionato, altrimenti seleziona solo questo
      if (newSet.size === 1 && newSet.has(materiale.id)) {
        newSet.clear();
      } else {
        newSet.clear();
        newSet.add(materiale.id);
      }
    }

    this.selectedMaterialIds.set(newSet);
    this.materialsSelected.emit(this.selectedMaterials());
  }

  onMaterialSelect(event: { material: Materiale; event?: MouseEvent }): void {
    this.selectMaterial(event.material, event.event);
  }

  isSelected(materiale: Materiale): boolean {
    return this.selectedMaterialIds().has(materiale.id);
  }

  clearSelection(): void {
    this.selectedMaterialIds.set(new Set());
    this.materialsSelected.emit([]);
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  getFolderIcon(isOpen: boolean): IconDefinition {
    return getFolderIcon(isOpen);
  }

  filterMaterials(folder: Folder): (Materiale | Folder)[] {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return folder.content;

    // Filtra ricorsivamente
    return folder.content.filter((item) => {
      if (this.isFolder(item)) {
        const folderMatch = item.name.toLowerCase().includes(query);
        const hasMatchingContent = this.filterMaterials(item).length > 0;
        return folderMatch || hasMatchingContent;
      }
      return item.filename.toLowerCase().includes(query);
    });
  }
}
