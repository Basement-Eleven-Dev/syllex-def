import { Component, input, output } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { getFileIcon, getFolderIcon } from '../../app/_utils/file-icons';

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
  selector: 'app-materiali-item',
  standalone: true,
  imports: [NgbCollapse, FontAwesomeModule],
  template: `
    @if (isFolder(item())) {
      <!-- Folder -->
      <li class="list-group-item p-0">
        <div
          class="folder-item d-flex align-items-center p-2 cursor-pointer"
          (click)="folderToggle.emit(item().id)"
          role="button"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'collapse-' + item().id"
        >
          <fa-icon [icon]="getFolderIcon(isExpanded())" class="me-2"></fa-icon>
          <span class="flex-grow-1">{{ asFolder(item()).name }}</span>
          <fa-icon
            [icon]="chevronIcon"
            class="transition-rotate"
            [class.rotate-90]="isExpanded()"
          >
          </fa-icon>
        </div>

        <!-- Folder Content (Recursive) -->
        <div [id]="'collapse-' + item().id" [ngbCollapse]="!isExpanded()">
          <ul class="list-group list-group-flush ms-4">
            @for (childItem of getFilteredContent(); track childItem.id) {
              <app-materiali-item
                [item]="childItem"
                [expandedFolders]="expandedFolders()"
                [selectedMaterialIds]="selectedMaterialIds()"
                [searchQuery]="searchQuery()"
                (folderToggle)="folderToggle.emit($event)"
                (materialSelect)="materialSelect.emit($event)"
              />
            }
          </ul>
        </div>
      </li>
    } @else {
      <!-- File -->
      <li
        class="list-group-item p-2 d-flex align-items-center cursor-pointer material-item"
        [class.selected]="isSelected()"
        (click)="
          materialSelect.emit({ material: asMateriale(item()), event: $event })
        "
        role="button"
      >
        <fa-icon
          [icon]="getFileIcon(asMateriale(item()).extension)"
          class="me-2"
        ></fa-icon>
        <span class="flex-grow-1">{{ asMateriale(item()).filename }}</span>
      </li>
    }
  `,
})
export class MaterialiItemComponent {
  item = input.required<Folder | Materiale>();
  expandedFolders = input.required<Set<string>>();
  selectedMaterialIds = input.required<Set<string>>();
  searchQuery = input.required<string>();

  folderToggle = output<string>();
  materialSelect = output<{ material: Materiale; event?: MouseEvent }>();

  chevronIcon = faChevronRight;

  isFolder(item: Folder | Materiale): item is Folder {
    return 'content' in item;
  }

  isExpanded(): boolean {
    const item = this.item();
    return this.isFolder(item) && this.expandedFolders().has(item.id);
  }

  isSelected(): boolean {
    const item = this.item();
    return !this.isFolder(item) && this.selectedMaterialIds().has(item.id);
  }

  asFolder(item: Folder | Materiale): Folder {
    return item as Folder;
  }

  asMateriale(item: Folder | Materiale): Materiale {
    return item as Materiale;
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  getFolderIcon(isOpen: boolean): IconDefinition {
    return getFolderIcon(isOpen);
  }

  getFilteredContent(): (Materiale | Folder)[] {
    const item = this.item();
    if (!this.isFolder(item)) return [];

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return item.content;

    return item.content.filter((child) => {
      if (this.isFolder(child)) {
        const folderMatch = child.name.toLowerCase().includes(query);
        const hasMatchingContent = this.hasMatchInContent(child, query);
        return folderMatch || hasMatchingContent;
      }
      return child.filename.toLowerCase().includes(query);
    });
  }

  private hasMatchInContent(folder: Folder, query: string): boolean {
    return folder.content.some((item) => {
      if (this.isFolder(item)) {
        const folderMatch = item.name.toLowerCase().includes(query);
        return folderMatch || this.hasMatchInContent(item, query);
      }
      return item.filename.toLowerCase().includes(query);
    });
  }
}
