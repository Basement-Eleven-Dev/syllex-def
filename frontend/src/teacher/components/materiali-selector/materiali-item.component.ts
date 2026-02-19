import { Component, input, output } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faChevronRight,
  faCheckCircle,
} from '@fortawesome/pro-solid-svg-icons';
import {
  getFileIcon,
  getFolderIcon,
  getIconColor,
  isTextFile,
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
    .cursor-not-allowed {
      cursor: not-allowed;
    }
    .transition-rotate {
      transition: transform 0.2s ease;
    }
    .rotate-90 {
      transform: rotate(90deg);
    }
    .vectorized-indicator {
      font-size: 0.8rem;
      color: #28a745;
    }
  `,
  template: `
    @if (shouldShow()) {
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
                  [embeddingCreationMode]="embeddingCreationMode()"
                  [expandedFolders]="expandedFolders()"
                  [selectedMaterialIds]="selectedMaterialIds()"
                  [associatedMaterialIds]="associatedMaterialIds()"
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
          @if (embeddingCreationMode() && item().isVectorized) {
            <div
              class="d-flex align-items-center gap-1 text-primary small opacity-50 ms-2"
            >
              <fa-icon [icon]="checkIcon"></fa-icon>
              <span>Processato</span>
            </div>
          }
        </li>
      }
    }
  `,
})
export class MaterialiItemComponent {
  item = input.required<MaterialInterface>();
  embeddingCreationMode = input<boolean>(false);
  expandedFolders = input.required<Set<string>>();
  selectedMaterialIds = input.required<Set<string>>();
  associatedMaterialIds = input.required<string[]>();
  searchQuery = input.required<string>();

  folderToggle = output<string>();
  materialSelect = output<MaterialInterface>();

  chevronIcon = faChevronRight;
  checkIcon = faCheckCircle;

  isFolder(item: MaterialInterface): boolean {
    return (
      item.type === 'folder' ||
      (item.content !== undefined && item.content !== null)
    );
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
    console.log('Getting icon for extension:', extension);
    return getFileIcon(extension);
  }

  getFolderIcon(isOpen: boolean): IconDefinition {
    return getFolderIcon(isOpen);
  }

  shouldShow(): boolean {
    const item = this.item();
    if (!this.embeddingCreationMode()) return true;

    const associatedIds = new Set(this.associatedMaterialIds());

    if (this.isFolder(item)) {
      return this.hasTextFileInFolder(item, associatedIds);
    }
    // Mostra se è un file di testo e NON è già associato a questo assistente
    return isTextFile(item.extension || '') && !associatedIds.has(item._id!);
  }

  private hasTextFileInFolder(
    folder: MaterialInterface,
    associatedIds: Set<string>,
  ): boolean {
    if (!folder.content) return false;
    return folder.content.some((child) => {
      if (this.isFolder(child)) {
        return this.hasTextFileInFolder(child, associatedIds);
      }
      return (
        isTextFile(child.extension || '') && !associatedIds.has(child._id!)
      );
    });
  }

  getFilteredContent(): MaterialInterface[] {
    const item = this.item();
    if (!this.isFolder(item)) return [];

    let content = item.content || [];

    // Filtra per embedding mode
    if (this.embeddingCreationMode()) {
      const associatedIds = new Set(this.associatedMaterialIds());
      content = content.filter((child) => {
        if (this.isFolder(child)) {
          return this.hasTextFileInFolder(child, associatedIds);
        }
        return (
          isTextFile(child.extension || '') && !associatedIds.has(child._id!)
        );
      });
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return content;

    return content.filter((child: MaterialInterface) => {
      if (this.isFolder(child)) {
        const folderMatch = child.name.toLowerCase().includes(query);
        const hasMatchingContent = this.hasMatchInContent(child, query);
        return folderMatch || hasMatchingContent;
      }
      return child.name.toLowerCase().includes(query);
    });
  }

  private hasMatchInContent(folder: MaterialInterface, query: string): boolean {
    if (!folder.content) return false;
    return folder.content!.some((item: MaterialInterface) => {
      if (this.isFolder(item)) {
        const folderMatch = item.name.toLowerCase().includes(query);
        return folderMatch || this.hasMatchInContent(item, query);
      }
      return item.name.toLowerCase().includes(query);
    });
  }
}
