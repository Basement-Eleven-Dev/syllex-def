import { Component, input, output } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import {
  getFileIcon,
  getFolderIcon,
  getIconColor,
} from '../../../app/_utils/file-icons';
import { MaterialInterface } from '../../../services/materiali-service';

@Component({
  selector: 'app-materiali-item',
  standalone: true,
  imports: [NgbCollapse, FontAwesomeModule],
  styles: `
    .cursor-pointer {
      cursor: pointer;
    }
    .transition-rotate {
      transition: transform 0.2s ease;
    }
    .rotate-90 {
      transform: rotate(90deg);
    }
  `,
  template: `
    @if (isFolder(item())) {
      <!-- Folder -->
      <li class="list-group-item p-2 mb-2" style="border-radius: 8px;">
        <div
          class="folder-item d-flex align-items-center p-2 cursor-pointer text-dark"
          (click)="folderToggle.emit(item()._id!)"
          role="button"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'collapse-' + item()._id"
        >
          <fa-icon
            [icon]="getFolderIcon(isExpanded())"
            [style.color]="getIconColor(item())"
            class="me-2"
          ></fa-icon>
          <span class="flex-grow-1">{{ item().name }}</span>
          <fa-icon
            [icon]="chevronIcon"
            class="transition-rotate"
            [class.rotate-90]="isExpanded()"
          >
          </fa-icon>
        </div>

        <!-- Folder Content (Recursive) -->
        <div [id]="'collapse-' + item()._id" [ngbCollapse]="!isExpanded()">
          <ul
            class="list-group list-group-flush ms-4 text-dark"
            style="border-radius: 8px;"
          >
            @for (childItem of getFilteredContent(); track childItem._id) {
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
        class="list-group-item p-2 d-flex align-items-center cursor-pointer text-dark mb-2"
        style="border-radius: 8px;"
        [class.bg-secondary]="isSelected()"
        (click)="materialSelect.emit(item())"
        role="button"
      >
        <fa-icon
          [icon]="getFileIcon(item().extension!)"
          [style.color]="getIconColor(item())"
          class="me-2"
        ></fa-icon>
        <span class="flex-grow-1">{{ item().name }}</span>
      </li>
    }
  `,
})
export class MaterialiItemComponent {
  item = input.required<MaterialInterface>();
  expandedFolders = input.required<Set<string>>();
  selectedMaterialIds = input.required<Set<string>>();
  searchQuery = input.required<string>();

  folderToggle = output<string>();
  materialSelect = output<MaterialInterface>();

  chevronIcon = faChevronRight;

  isFolder(item: MaterialInterface): boolean {
    return item.type === 'folder';
  }

  getIconColor(item: MaterialInterface): string {
    return getIconColor(item.extension || '');
  }

  isExpanded(): boolean {
    const item = this.item();
    return this.isFolder(item) && this.expandedFolders().has(item._id!);
  }

  isSelected(): boolean {
    const item = this.item();
    return !this.isFolder(item) && this.selectedMaterialIds().has(item._id!);
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  getFolderIcon(isOpen: boolean): IconDefinition {
    return getFolderIcon(isOpen);
  }

  getFilteredContent(): MaterialInterface[] {
    const item = this.item();
    if (!this.isFolder(item)) return [];

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return item.content!;

    return item.content!.filter((child: MaterialInterface) => {
      if (this.isFolder(child)) {
        const folderMatch = child.name.toLowerCase().includes(query);
        const hasMatchingContent = this.hasMatchInContent(child, query);
        return folderMatch || hasMatchingContent;
      }
      return child.name.toLowerCase().includes(query);
    });
  }

  private hasMatchInContent(folder: MaterialInterface, query: string): boolean {
    return folder.content!.some((item: MaterialInterface) => {
      if (this.isFolder(item)) {
        const folderMatch = item.name.toLowerCase().includes(query);
        return folderMatch || this.hasMatchInContent(item, query);
      }
      return item.name.toLowerCase().includes(query);
    });
  }
}
