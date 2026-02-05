import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MaterialeCard } from '../../components/materiale-card/materiale-card';
import {
  MaterialiService,
  Folder,
  Materiale,
} from '../../services/materiali-service';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  faChevronRight,
  faPlus,
  faUpload,
  faEllipsisVertical,
  faSparkles,
  faRobot,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { MaterialeContextualMenu } from '../../components/materiale-contextual-menu/materiale-contextual-menu';
import {
  getFileIcon,
  getFolderIcon,
  getIconColor,
} from '../../app/_utils/file-icons';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';
import { MaterialeDragDropService } from '../../services/materiale-drag-drop.service';
import { MaterialeSearchService } from '../../services/materiale-search.service';
import { MaterialeSelectionService } from '../../services/materiale-selection.service';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';

@Component({
  selector: 'app-materiali',
  imports: [
    MaterialeCard,
    FontAwesomeModule,
    ViewTypeToggle,
    FormsModule,
    DatePipe,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    MaterialeContextualMenu,
  ],
  templateUrl: './materiali.html',
  styleUrl: './materiali.scss',
})
export class Materiali {
  ChevronRightIcon = faChevronRight;
  PlusIcon = faPlus;
  UploadIcon = faUpload;
  ThreeDotsIcon = faEllipsisVertical;
  SparklesIcon = faSparkles;
  RobotIcon = faRobot;

  viewType: ViewType = 'grid';

  public materialiService = inject(MaterialiService);
  private dragDropService = inject(MaterialeDragDropService);
  private searchService = inject(MaterialeSearchService);
  public selectionService = inject(MaterialeSelectionService);
  private offCanvasService = inject(NgbOffcanvas);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  searchTerm = signal<string>('');
  highlightedItemId = signal<string | null>(null);
  private folderBeforeSearch: Folder | null = null;
  private isSearchActive = false;

  constructor() {
    effect(() => {
      const term = this.searchTerm().trim();
      if (term.length >= 2) {
        if (!this.isSearchActive) {
          this.folderBeforeSearch = { ...this.rootFolder() };
          this.isSearchActive = true;
        }
        this.performSearch(term);
      } else if (term.length === 0 && this.isSearchActive) {
        if (this.folderBeforeSearch) {
          this.rootFolder.set(this.folderBeforeSearch);
          this.folderBeforeSearch = null;
        }
        this.isSearchActive = false;
        this.highlightedItemId.set(null);
      }
    });
  }

  private readonly ALLOWED_EXTENSIONS = [
    'pdf',
    'docx',
    'doc',
    'xlsx',
    'xls',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'txt',
  ];

  rootFolder = signal<Folder>({
    id: 'root',
    name: '/',
    content: this.materialiService.root,
    createdAt: new Date(),
  });

  currentPathArray = computed(() => {
    const folder = this.rootFolder();
    return this.materialiService.getCurrentPath(folder.name);
  });

  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }

  onSelectItem(item: Folder | Materiale, event?: MouseEvent): void {
    event?.stopPropagation();
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    this.selectionService.toggle(item.id, isMultiSelect);
  }

  isItemSelected(itemId: string): boolean {
    return this.selectionService.isSelected(itemId);
  }

  onRequestOpenItem(item: Folder | Materiale | string): void {
    this.folderBeforeSearch = null;
    this.isSearchActive = false;

    if (item === 'Home') {
      this.rootFolder.set(this.searchService.getRootFolder());
      return;
    }

    if (typeof item === 'string') {
      const folder = this.materialiService.getFolderFromName(item);
      if (folder) this.rootFolder.set(folder);
      return;
    }

    if ('content' in item) {
      this.rootFolder.set(item as Folder);
    }
  }

  onRequestUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const extension = this.getFileExtension(file.name);

    if (!this.isExtensionAllowed(extension)) {
      alert(
        `Formato file non supportato. Estensioni consentite: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
      );
      input.value = '';
      return;
    }

    this.materialiService.uploadMaterial(file, this.rootFolder());
    this.rootFolder.set({ ...this.rootFolder() });

    input.value = '';
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private isExtensionAllowed(extension: string): boolean {
    return this.ALLOWED_EXTENSIONS.includes(extension);
  }

  onCreateNewFolder(): void {
    this.materialiService.createNewFolder(this.rootFolder());
    this.rootFolder.set({ ...this.rootFolder() });
  }

  // Drag and Drop handlers
  onDragStart(item: Folder | Materiale, event: DragEvent): void {
    this.dragDropService.startDrag(item, this.selectionService.getSelection());
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', item.id);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      target.classList.remove('drag-over');
    }
  }

  onDrop(targetItem: Folder | Materiale | string, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    const success = this.dragDropService.handleDrop(
      targetItem,
      this.rootFolder().id,
    );
    if (success) {
      this.rootFolder.set({ ...this.rootFolder() });
      this.selectionService.clear();
    }
  }

  onDragEnterCard(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over-wrapper');
  }

  onDragLeaveCard(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      target.classList.remove('drag-over-wrapper');
    }
  }

  onDropCard(targetItem: Folder, event: DragEvent): void {
    this.onDrop(targetItem, event);
  }

  onRequestDeleteItem(item: Materiale | Folder): void {
    this.materialiService.deleteItem(item.id);
    this.rootFolder.set({ ...this.rootFolder() });
  }

  onRequestRenameItem(item: Materiale | Folder, newName: string): void {
    this.materialiService.renameItem(item.id, newName);
    this.rootFolder.set({ ...this.rootFolder() });
  }

  private performSearch(term: string): void {
    const searchResult = this.searchService.search(
      term,
      this.materialiService.root,
    );

    if (searchResult) {
      if (searchResult.parentPath.length > 0) {
        const parentFolder =
          searchResult.parentPath[searchResult.parentPath.length - 1];
        this.rootFolder.set(parentFolder);
      } else {
        this.rootFolder.set(this.searchService.getRootFolder());
      }

      this.highlightedItemId.set(searchResult.item.id);
    } else {
      this.highlightedItemId.set(null);
    }
  }

  // Helper methods per visualizzazione tabellare
  getItemIcon(item: Folder | Materiale): IconDefinition {
    if ('content' in item) {
      return getFolderIcon(false);
    }
    return getFileIcon(item.name);
  }

  getItemColor(item: Folder | Materiale): string {
    if ('content' in item) {
      return getIconColor('folder');
    }
    return getIconColor(this.getFileExtension(item.name));
  }

  getItemType(item: Folder | Materiale): string {
    if ('content' in item) {
      const folder = item as Folder;
      return `Cartella (${folder.content.length})`;
    }
    const ext = this.getFileExtension(item.name);
    return ext ? ext.toUpperCase() : 'File';
  }

  getItemSize(item: Folder | Materiale): string {
    if ('content' in item) {
      return '-';
    }
    // Placeholder: in futuro si può aggiungere la dimensione reale
    return '-';
  }

  onRequestGenerate() {
    this.offCanvasService.open(GenAiContents, {
      position: 'end',
      backdrop: true,
    });
  }

  isAIGenerated(item: Folder | Materiale): boolean {
    if ('content' in item) {
      return false;
    } else {
      if ('aiGenerated' in item) return true;
    }
    return false;
  }
}
