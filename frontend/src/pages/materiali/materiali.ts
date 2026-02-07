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
import { FilesService } from '../../services/files-service';

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
  private fileService = inject(FilesService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  searchTerm = signal<string>('');
  highlightedItemId = signal<string | null>(null);
  private folderBeforeSearch: MaterialInterface | null = null;
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
          this.materialiService.currentFolder.set(this.folderBeforeSearch);
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

  private readonly ROOT_FOLDER_CONFIG = {
    _id: 'root',
    name: '/',
    type: 'folder' as const,
    createdAt: new Date(),
  };

  rootFolder = computed(() => {
    const current = this.materialiService.currentFolder();
    return (
      current || {
        ...this.ROOT_FOLDER_CONFIG,
        content: this.materialiService.root(),
      }
    );
  });

  currentPathArray = computed(() => {
    const folder = this.rootFolder();
    return this.materialiService.getCurrentPath(folder.name);
  });

  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }

  onSelectItem(item: MaterialInterface, event?: MouseEvent): void {
    event?.stopPropagation();
    const isMultiSelect = event?.ctrlKey || event?.metaKey;
    this.selectionService.toggle(item._id!, isMultiSelect);
  }

  isItemSelected(itemId: string): boolean {
    return this.selectionService.isSelected(itemId);
  }

  onRequestOpenItem(item: MaterialInterface | string): void {
    this.folderBeforeSearch = null;
    this.isSearchActive = false;

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

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private isExtensionAllowed(extension: string): boolean {
    return this.ALLOWED_EXTENSIONS.includes(extension);
  }

  onCreateNewFolder() {
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

  // Drag and Drop handlers
  onDragStart(item: MaterialInterface, event: DragEvent): void {
    this.dragDropService.startDrag(item, this.selectionService.getSelection());
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', item._id!);
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
    const targetClass = target.tagName === 'TR' ? 'drag-over' : 'drag-over';
    target.classList.add(targetClass);
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      target.classList.remove('drag-over', 'drag-over-wrapper');
    }
  }

  onDrop(targetItem: MaterialInterface | string, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over', 'drag-over-wrapper');

    const success = this.dragDropService.handleDrop(targetItem);
    if (success) {
      this.selectionService.clear();
    }
  }

  onRequestDeleteItem(item: MaterialInterface): void {
    this.materialiService.deleteItem(item._id!).subscribe({
      next: () => {
        this.selectionService.clear();
      },
      error: (err) => console.error("Errore durante l'eliminazione:", err),
    });
  }

  onRequestRenameItem(item: MaterialInterface, newName: string): void {
    this.materialiService.renameItem(item._id!, newName).subscribe({
      next: () => {},
      error: (err) => console.error('Errore durante la rinomina:', err),
    });
  }

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

  // Helper methods per visualizzazione tabellare
  getItemIcon(item: MaterialInterface): IconDefinition {
    return item.type === 'folder'
      ? getFolderIcon(false)
      : getFileIcon(item.name);
  }

  getItemColor(item: MaterialInterface): string {
    return item.type === 'folder'
      ? getIconColor('folder')
      : getIconColor(this.getFileExtension(item.name));
  }

  getItemType(item: MaterialInterface): string {
    if (item.type === 'folder') {
      return `Cartella (${item.content?.length || 0})`;
    }
    const ext = this.getFileExtension(item.name);
    return ext ? ext.toUpperCase() : 'File';
  }

  getItemSize(item: MaterialInterface): string {
    return item.type === 'folder' ? '-' : '-';
  }

  isAIGenerated(item: MaterialInterface): boolean {
    return item.type !== 'folder' && item.aiGenerated === true;
  }

  onRequestGenerate(): void {
    this.offCanvasService.open(GenAiContents, {
      position: 'end',
      backdrop: true,
    });
  }
}
