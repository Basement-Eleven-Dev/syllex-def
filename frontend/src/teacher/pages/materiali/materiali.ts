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
  MaterialInterface,
} from '../../../services/materiali-service';
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
  faXmark,
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
} from '../../../app/_utils/file-icons';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';
import { MaterialeDragDropService } from '../../../services/materiale-drag-drop.service';
import { MaterialeSearchService } from '../../../services/materiale-search.service';
import { MaterialeSelectionService } from '../../../services/materiale-selection.service';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import { FilesService } from '../../../services/files-service';

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
  // Costanti statiche
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
    'pptx',
  ];

  private readonly ROOT_FOLDER_CONFIG = {
    _id: 'root',
    name: '/',
    type: 'folder' as const,
    createdAt: new Date(),
  };

  // ViewChild
  @ViewChild('fileInput') FileInput!: ElementRef<HTMLInputElement>;

  // Dependency Injection
  readonly materialiService = inject(MaterialiService);
  private readonly dragDropService = inject(MaterialeDragDropService);
  private readonly searchService = inject(MaterialeSearchService);
  readonly selectionService = inject(MaterialeSelectionService);
  private readonly offCanvasService = inject(NgbOffcanvas);
  private readonly fileService = inject(FilesService);

  // Icons (readonly)
  protected readonly chevronRightIcon = faChevronRight;
  protected readonly plusIcon = faPlus;
  protected readonly uploadIcon = faUpload;
  protected readonly threeDotsIcon = faEllipsisVertical;
  protected readonly sparklesIcon = faSparkles;
  protected readonly robotIcon = faRobot;
  protected readonly ClearIcon = faXmark;

  // Signals
  protected readonly viewType = signal<ViewType>(
    this.loadViewTypePreference('materiali') || 'grid',
  );
  protected readonly searchTerm = signal<string>('');
  protected readonly highlightedItemId = signal<string | null>(null);

  protected readonly rootFolder = computed(() => {
    const current = this.materialiService.currentFolder();
    return (
      current || {
        ...this.ROOT_FOLDER_CONFIG,
        content: this.materialiService.root(),
      }
    );
  });

  protected readonly currentPathArray = computed(() => {
    const folder = this.rootFolder();
    return this.materialiService.getCurrentPath(folder.name);
  });

  // Proprietà private
  private FolderBeforeSearch: MaterialInterface | null = null;
  private IsSearchActive = false;

  constructor() {
    effect(() => {
      const term = this.searchTerm().trim();
      if (term.length >= 2) {
        if (!this.IsSearchActive) {
          this.FolderBeforeSearch = { ...this.rootFolder() };
          this.IsSearchActive = true;
        }
        this.performSearch(term);
      } else if (term.length === 0 && this.IsSearchActive) {
        if (this.FolderBeforeSearch) {
          this.materialiService.currentFolder.set(this.FolderBeforeSearch);
          this.FolderBeforeSearch = null;
        }
        this.IsSearchActive = false;
        this.highlightedItemId.set(null);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    if (this.FolderBeforeSearch) {
      this.materialiService.currentFolder.set(this.FolderBeforeSearch);
      this.FolderBeforeSearch = null;
    }
    this.IsSearchActive = false;
    this.highlightedItemId.set(null);
  }

  // Event Handlers
  protected onChangeViewType(type: ViewType): void {
    this.viewType.set(type);
  }

  private loadViewTypePreference(pageKey: string): ViewType | null {
    try {
      const saved = localStorage.getItem(`viewType_${pageKey}`);
      return saved === 'grid' || saved === 'table' ? saved : null;
    } catch (error) {
      return null;
    }
  }

  protected onSelectItem(item: MaterialInterface, event?: MouseEvent): void {
    event?.stopPropagation();
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    this.selectionService.toggle(item._id!, isMultiSelect);
  }

  protected isItemSelected(itemId: string): boolean {
    return this.selectionService.isSelected(itemId);
  }

  protected onRequestOpenItem(item: MaterialInterface | string): void {
    this.FolderBeforeSearch = null;
    this.IsSearchActive = false;

    if (item === 'Home') {
      this.materialiService.currentFolder.set(null);
      return;
    }

    if (typeof item === 'string') {
      const folder = this.materialiService.getFolderFromName(item);
      if (folder) this.materialiService.currentFolder.set(folder);
      return;
    }

    if (item.type === 'folder') {
      this.materialiService.currentFolder.set(item);
    }
  }

  protected onRequestUpload(): void {
    this.FileInput.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
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

    this.fileService.uploadFile(file.name, file).subscribe((url) => {
      const newMaterial: MaterialInterface = {
        _id: 'temp-id-' + Date.now(),
        name: file.name,
        type: 'file',
        url: url,
        extension: extension,
        createdAt: new Date(),
      };
      this.materialiService
        .createMaterial(newMaterial, this.rootFolder())
        .subscribe({
          next: () => {},
          error: (err) =>
            console.error('Errore durante la creazione del materiale:', err),
        });
      input.value = '';
    });
  }

  protected onCreateNewFolder(): void {
    this.materialiService
      .createMaterial(
        {
          _id: 'temp-id-' + Date.now(),
          name: 'Nuova Cartella',
          type: 'folder',
          content: [],
        } as MaterialInterface,
        this.rootFolder(),
      )
      .subscribe({
        next: () => {},
        error: (err) =>
          console.error('Errore durante la creazione della cartella:', err),
      });
  }

  protected onDragStart(item: MaterialInterface, event: DragEvent): void {
    this.dragDropService.startDrag(item, this.selectionService.getSelection());
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', item._id!);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'move';
  }

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const targetClass = target.tagName === 'TR' ? 'drag-over' : 'drag-over';
    target.classList.add(targetClass);
  }

  protected onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      target.classList.remove('drag-over', 'drag-over-wrapper');
    }
  }

  protected onDrop(
    targetItem: MaterialInterface | string,
    event: DragEvent,
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over', 'drag-over-wrapper');

    const success = this.dragDropService.handleDrop(targetItem);
    if (success) {
      this.selectionService.clear();
    }
  }

  protected onRequestDeleteItem(item: MaterialInterface): void {
    this.materialiService.deleteItem(item._id!).subscribe({
      next: () => {
        this.selectionService.clear();
      },
      error: (err) => console.error("Errore durante l'eliminazione:", err),
    });
  }

  protected onRequestRenameItem(
    item: MaterialInterface,
    newName: string,
  ): void {
    this.materialiService.renameItem(item._id!, newName).subscribe({
      next: () => {},
      error: (err) => console.error('Errore durante la rinomina:', err),
    });
  }

  protected getItemIcon(item: MaterialInterface): IconDefinition {
    return item.type === 'folder'
      ? getFolderIcon(false)
      : getFileIcon(item.name);
  }

  protected getItemColor(item: MaterialInterface): string {
    return item.type === 'folder'
      ? getIconColor('folder')
      : getIconColor(this.getFileExtension(item.name));
  }

  protected getItemType(item: MaterialInterface): string {
    if (item.type === 'folder') {
      return `Cartella (${item.content?.length || 0})`;
    }
    const ext = this.getFileExtension(item.name);
    return ext ? ext.toUpperCase() : 'File';
  }

  protected getItemSize(item: MaterialInterface): string {
    return item.type === 'folder' ? '-' : '-';
  }

  protected isAIGenerated(item: MaterialInterface): boolean {
    return item.type !== 'folder' && item.aiGenerated === true;
  }

  protected onRequestGenerate(): void {
    this.offCanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
      backdrop: true,
    });
  }

  // Private Methods
  private performSearch(term: string): void {
    const searchResult = this.searchService.search(
      term,
      this.materialiService.root(),
    );

    if (searchResult) {
      if (searchResult.parentPath.length > 0) {
        const parentFolder =
          searchResult.parentPath[searchResult.parentPath.length - 1];
        this.materialiService.currentFolder.set(parentFolder);
      } else {
        this.materialiService.currentFolder.set(null);
      }

      this.highlightedItemId.set(searchResult.item._id!);
    } else {
      this.highlightedItemId.set(null);
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private isExtensionAllowed(extension: string): boolean {
    return this.ALLOWED_EXTENSIONS.includes(extension);
  }
}
