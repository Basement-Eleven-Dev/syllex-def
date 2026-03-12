import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MaterialeCard } from '../../components/materiale-card/materiale-card';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
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
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbOffcanvas,
  NgbModal,
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
import { MaterialeDragDropService } from '../../../services/materiali/materiale-drag-drop.service';
import { MaterialiFacadeService } from '../../../services/materiali/materiali-facade.service';
import { ConfirmService } from '../../../services/confirm.service';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import {
  FILE_INPUT_ACCEPT,
  isFileExtensionAllowed,
  getFileExtension,
  getAllowedExtensionsLabel,
} from '../../../app/_utils/file-validation.utils';
import { StorageLimitBar } from '../../components/storage-limit-bar/storage-limit-bar';
import { SuggestedTopicsModal } from '../../components/suggested-topics-modal/suggested-topics-modal';
import { effect, untracked } from '@angular/core';

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
    StorageLimitBar,
  ],
  templateUrl: './materiali.html',
  styleUrl: './materiali.scss',
})
export class Materiali {
  @ViewChild('fileInput')
  private readonly fileInput!: ElementRef<HTMLInputElement>;

  // ── Services ──────────────────────────────────────────────────────
  readonly facade = inject(MaterialiFacadeService);
  private readonly dragDropService = inject(MaterialeDragDropService);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly confirmService = inject(ConfirmService);
  private readonly modalService = inject(NgbModal);

  constructor() {
    effect(() => {
      const topics = this.suggestedTopics();
      if (topics.length > 0 && !this.modalService.hasOpenModals()) {
        untracked(() => this.openSuggestedTopicsModal(topics));
      }
    });
  }

  // ── Icons ─────────────────────────────────────────────────────────
  protected readonly icons = {
    chevronRight: faChevronRight,
    plus: faPlus,
    upload: faUpload,
    threeDots: faEllipsisVertical,
    sparkles: faSparkles,
    robot: faRobot,
    clear: faXmark,
    trash: faTrash,
  } as const;

  // ── State proxied from facade (avoids template changes) ───────────
  readonly searchTerm = this.facade.searchTerm;
  readonly rootFolder = this.facade.rootFolder;
  readonly currentPathArray = this.facade.currentPathArray;
  readonly highlightedItemId = this.facade.highlightedItemId;
  readonly selectedCount = this.facade.selectedCount;
  readonly isStorageFull = this.facade.isStorageFull;
  readonly suggestedTopics = this.facade.suggestedTopics;

  // ── UI-only state ─────────────────────────────────────────────────
  protected readonly viewType = signal<ViewType>('grid');
  protected readonly acceptedExtensions = FILE_INPUT_ACCEPT;

  // ── View Type ─────────────────────────────────────────────────────

  protected onChangeViewType(type: ViewType): void {
    this.viewType.set(type);
  }

  // ── Navigation ────────────────────────────────────────────────────

  protected onRequestOpenItem(item: MaterialInterface | string): void {
    this.facade.openItem(item);
  }

  // ── File Upload ───────────────────────────────────────────────────

  protected onRequestUpload(): void {
    this.fileInput.nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!isFileExtensionAllowed(file.name)) {
      alert(
        `Formato file non supportato. Estensioni consentite: ${getAllowedExtensionsLabel()}`,
      );
      input.value = '';
      return;
    }

    this.facade.uploadFile(file).subscribe({
      next: () => (input.value = ''),
      error: (err) => console.error('Errore durante il caricamento:', err),
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────

  protected onCreateNewFolder(): void {
    this.facade.createFolder().subscribe();
  }

  protected async onRequestDeleteItem(item: MaterialInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      `Sei sicuro di voler eliminare "${item.name}"?`,
    );
    if (!confirmed) return;

    this.facade.deleteItem(item._id!).subscribe();
  }

  protected async onDeleteSelection(): Promise<void> {
    const count = this.selectedCount();
    if (count === 0) return;

    const confirmed = await this.confirmService.confirm(
      `Sei sicuro di voler eliminare i ${count} elementi selezionati?`,
    );
    if (!confirmed) return;

    this.facade.deleteSelectedItems().subscribe();
  }

  protected onRequestRenameItem(
    item: MaterialInterface,
    newName: string,
  ): void {
    this.facade.renameItem(item._id!, newName).subscribe();
  }

  // ── Selection ─────────────────────────────────────────────────────

  protected onSelectItem(
    item: MaterialInterface,
    event?: MouseEvent | Event,
  ): void {
    event?.stopPropagation();
    const hasSelection = this.selectedCount() > 0;
    const isMultiSelect =
      event instanceof MouseEvent
        ? event.ctrlKey || event.metaKey || hasSelection
        : true;
    this.facade.selectItem(item._id!, isMultiSelect);
  }

  protected isItemSelected(itemId: string): boolean {
    return this.facade.isItemSelected(itemId);
  }

  protected isAllSelected(): boolean {
    return this.facade.isAllSelected();
  }

  protected toggleSelectAll(): void {
    this.facade.toggleSelectAll();
  }

  protected onDeselectAll(): void {
    this.facade.deselectAll();
  }

  // ── Drag & Drop (thin delegation) ─────────────────────────────────

  protected onDragStart(item: MaterialInterface, event: DragEvent): void {
    this.dragDropService.startDrag(item, this.facade.getSelection());
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
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  protected onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target.contains(event.relatedTarget as HTMLElement)) {
      target.classList.remove('drag-over', 'drag-over-wrapper');
    }
  }

  protected onDrop(
    targetItem: MaterialInterface | string,
    event: DragEvent,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove(
      'drag-over',
      'drag-over-wrapper',
    );

    if (this.dragDropService.handleDrop(targetItem)) {
      this.facade.deselectAll();
    }
  }

  // ── Icon Helpers ──────────────────────────────────────────────────

  protected getItemIcon(item: MaterialInterface): IconDefinition {
    return item.type === 'folder'
      ? getFolderIcon(false)
      : getFileIcon(item.name);
  }

  protected getItemColor(item: MaterialInterface): string {
    return item.type === 'folder'
      ? getIconColor('folder')
      : getIconColor(getFileExtension(item.name));
  }

  protected getItemType(item: MaterialInterface): string {
    if (item.type === 'folder') {
      return `Cartella (${item.content?.length || 0})`;
    }
    const ext = getFileExtension(item.name);
    return ext ? ext.toUpperCase() : 'File';
  }

  protected getItemSize(item: MaterialInterface): string {
    return item.type === 'folder' ? '-' : '-';
  }

  protected isAIGenerated(item: MaterialInterface): boolean {
    return item.type !== 'folder' && item.aiGenerated === true;
  }

  // ── Search ────────────────────────────────────────────────────────

  protected clearFilters(): void {
    this.facade.clearSearch();
  }

  // ── GenAI ─────────────────────────────────────────────────────────

  protected onRequestGenerate(): void {
    this.offcanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
      backdrop: true,
    });
  }

  // ── Topic Suggestions ─────────────────────────────────────────────

  protected onAddSuggestedTopic(topic: string): void {
    this.facade.addSuggestedTopic(topic).subscribe({
      next: () => console.log(`Argomento "${topic}" aggiunto con successo.`),
      error: (err) =>
        console.error(`Errore nell'aggiunta dell'argomento "${topic}":`, err),
    });
  }

  protected onDismissSuggestedTopic(topic: string): void {
    this.facade.dismissSuggestedTopic(topic);
  }

  private openSuggestedTopicsModal(topics: string[]): void {
    const modalRef = this.modalService.open(SuggestedTopicsModal, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.topics = topics;
  }
}
