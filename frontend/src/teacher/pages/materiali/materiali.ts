import {
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  ElementRef,
  OnInit,
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
  faArrowLeft,
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
import { AiOverlay } from '../../components/ai-overlay/ai-overlay';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import { SuggestedTopicsModal } from '../../components/suggested-topics-modal/suggested-topics-modal';
import { effect, untracked } from '@angular/core';
import { FeedbackService } from '../../../services/feedback-service';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexSearchInput } from '../../components/UI/syllex-search-input/syllex-search-input';
import { SyllexClearButton } from '../../components/UI/syllex-clear-button/syllex-clear-button';
import { SyllexEmptyState } from '../../components/UI/syllex-empty-state/syllex-empty-state';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    AiOverlay,
    SyllexButton,
    SyllexSearchInput,
    SyllexClearButton,
    TourAnchorNgBootstrapDirective,
    SyllexPageHeader,
    SyllexEmptyState,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './materiali.html',
  styleUrl: './materiali.scss',
})
export class Materiali implements OnInit {
  @ViewChild('fileInput')
  private readonly fileInput!: ElementRef<HTMLInputElement>;

  // ── Services ──────────────────────────────────────────────────────
  readonly facade = inject(MaterialiFacadeService);
  private readonly dragDropService = inject(MaterialeDragDropService);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly confirmService = inject(ConfirmService);
  private readonly modalService = inject(NgbModal);
  private readonly feedbackService = inject(FeedbackService);
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    effect(() => {
      const topics = this.suggestedTopics();
      if (topics.length > 0 && !this.modalService.hasOpenModals()) {
        untracked(() => this.openSuggestedTopicsModal(topics));
      }
    });
  }

  ngOnInit(): void {
    this.facade.reload();
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
    arrowLeft: faArrowLeft,
  } as const;

  // ── State proxied from facade (avoids template changes) ───────────
  readonly searchTerm = this.facade.searchTerm;
  readonly rootFolder = this.facade.rootFolder;
  readonly currentPathArray = this.facade.currentPathArray;
  readonly highlightedItemId = this.facade.highlightedItemId;
  readonly selectedCount = this.facade.selectedCount;
  readonly isStorageFull = this.facade.isStorageFull;
  readonly suggestedTopics = this.facade.suggestedTopics;

  readonly files = computed(() =>
    (this.rootFolder()?.content ?? []).filter((item) => item.type === 'file'),
  );

  readonly folders = computed(() =>
    (this.rootFolder()?.content ?? []).filter((item) => item.type === 'folder'),
  );

  readonly allItems = computed(() => {
    const content = this.rootFolder()?.content ?? [];
    return [...content].sort((a, b) => {
      // Cartelle sempre prima
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      // Poi per data decrescente (più recente prima)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  });

  // ── UI-only state ─────────────────────────────────────────────────
  protected readonly viewType = signal<ViewType>('grid');
  protected readonly acceptedExtensions = FILE_INPUT_ACCEPT;
  protected readonly isUploading = signal(false);

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
        this.translocoService.translate('materiali.alert_format', { extensions: getAllowedExtensionsLabel() }),
      );
      input.value = '';
      return;
    }

    this.isUploading.set(true);
    this.facade.uploadFile(file).subscribe({
      next: () => {
        input.value = '';
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Errore durante il caricamento:', err);
        this.isUploading.set(false);
        this.feedbackService.showFeedback(
          this.translocoService.translate('materiali.error_upload'),
          false,
        );
      },
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────

  protected onCreateNewFolder(): void {
    this.facade.createFolder().subscribe();
  }

  protected async onRequestDeleteItem(item: MaterialInterface): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      this.translocoService.translate('materiali.confirm_delete_item', { name: item.name }),
    );
    if (!confirmed) return;

    this.facade.deleteItem(item._id!).subscribe();
  }

  protected async onDeleteSelection(): Promise<void> {
    const count = this.selectedCount();
    if (count === 0) return;

    const confirmed = await this.confirmService.confirm(
      this.translocoService.translate('materiali.confirm_delete_multiple', { count }),
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
      return this.translocoService.translate('materiali.type_folder', { count: item.content?.length || 0 });
    }
    const ext = getFileExtension(item.name);
    return ext ? ext.toUpperCase() : this.translocoService.translate('materiali.type_file');
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
    const offcanvasRef = this.offcanvasService.open(GenAiContents, {
      position: 'end',
      panelClass: 'offcanvas-large',
      scroll: true,
      backdrop: true,
    });

    offcanvasRef.result.then(
      () => this.facade.reload(),
      () => this.facade.reload()
    );
  }

  // ── Topic Suggestions ─────────────────────────────────────────────

  protected onAddSuggestedTopic(topic: string): void {
    this.facade.addSuggestedTopic(topic).subscribe({
      next: () =>
        this.feedbackService.showFeedback(
          this.translocoService.translate('materiali.topic_added_success', { topic }),
          true,
        ),
      error: (err) => {
        console.error(`Errore nell'aggiunta dell'argomento "${topic}":`, err);
        this.feedbackService.showFeedback(
          this.translocoService.translate('materiali.topic_added_error'),
          false,
        );
      },
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
