import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  ViewChild,
  inject,
  ElementRef,
} from '@angular/core';
import {
  FaIconComponent,
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  getFileIcon,
  getFolderIcon,
  getIconColor,
} from '../../../app/_utils/file-icons';
import {
  faEllipsisVertical,
  faRobot,
  faShareNodes,
  faDownload,
  faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbModal,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { MaterialeContextualMenu } from '../materiale-contextual-menu/materiale-contextual-menu';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { FileViewer } from '../file-viewer/file-viewer';
import { SyllexBadge } from '../UI/syllex-badge/syllex-badge';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { TelemetryService } from '../../../services/telemetry-service';

@Component({
  selector: 'app-materiale-card',
  imports: [
    FaIconComponent,
    FontAwesomeModule,
    MaterialeContextualMenu,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbTooltip,
    SyllexBadge,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './materiale-card.html',
  styleUrl: './materiale-card.scss',
})
export class MaterialeCard implements OnInit, OnDestroy, OnChanges {
  ShareNodesIcon = faShareNodes;
  DownloadIcon = faDownload;
  @Input() item!: MaterialInterface;
  @Input() highlightedItemId: string | null = null;
  @Input() isSelected: boolean = false;
  @Input() showSharing: boolean = true;
  @Input() showActions: boolean = true;
  @Input() showAiBadge: boolean = true;
  @Input() showDownload: boolean = true;

  @Output() openItem = new EventEmitter<MaterialInterface>();
  @Output() renameItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<void>();
  @Output() selectItemEvent = new EventEmitter<MouseEvent>();

  @ViewChild('contextualMenu') contextualMenuRef?: MaterialeContextualMenu;

  modalService = inject(NgbModal);
  elementRef = inject(ElementRef);
  private telemetry = inject(TelemetryService);

  readonly ThreeDotsIcon = faEllipsisVertical;
  readonly RobotIcon = faRobot;
  readonly SparklesIcon = faSparkles;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['highlightedItemId'] && this.highlightedItemId === this.item._id) {
      setTimeout(() => {
        this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }

  requestAssignToClass(): void {
    this.contextualMenuRef?.onRequestAssignToClass();
  }

  isReady: boolean | undefined = undefined;
  polingInterval: any;

  ngOnInit(): void {
    if (this.item.url?.includes('proxy/gamma/')) {
      this.isReady = false;
      this.polingInterval = setInterval(async () => {
        try {
          // redirect: 'follow' (default) means fetch will follow the 301 automatically;
          // response.redirected === true and response.url holds the final destination URL.
          const response = await fetch(this.item.url!, { method: 'GET' });

          if (response.status === 404) return; // not ready yet, keep polling

          clearInterval(this.polingInterval);

          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              this.item = { ...this.item, url: data.url };
            }
          }

          this.isReady = true;
        } catch (error) {
          console.error('Error polling for material readiness:', error);
        }
      }, 5000); // Poll every 5 seconds
    } else {
      this.isReady = true;
    }
  }

  ngOnDestroy(): void {
    if (this.polingInterval) {
      clearInterval(this.polingInterval);
    }
  }

  get isFolder(): boolean {
    return this.item.type === 'folder';
  }

  get icon(): IconDefinition {
    return this.isFolder
      ? getFolderIcon(false)
      : getFileIcon(this.item.extension || '');
  }

  get iconColor(): string {
    return this.isFolder
      ? getIconColor('folder')
      : getIconColor(this.item.extension || '');
  }

  get folderContentLength(): number {
    return this.isFolder && this.item.content ? this.item.content.length : 0;
  }

  get isAIGenerated(): boolean {
    return !this.isFolder && this.item.aiGenerated === true;
  }

  selectItem(event: MouseEvent | Event): void {
    event.stopPropagation();
    this.selectItemEvent.emit(event as MouseEvent);
  }

  requestOpenItem(): void {
    if (this.isFolder) {
      this.openItem.emit(this.item);
    } else {
      this.telemetry.track({
        action: 'material.open',
        materialId: this.item._id,
        payload: {
          extension: this.item.extension ?? '',
          aiGenerated: this.item.aiGenerated === true,
          isMap: this.item.isMap === true,
        },
      });
      let modalRef = this.modalService.open(FileViewer, {
        centered: true,
        size: 'lg',
      });

      modalRef.componentInstance.docUrl = this.item.url;
      modalRef.componentInstance.extension = this.item.extension;
      modalRef.componentInstance.isMap = this.item.isMap;
    }
  }

  downloadFile(event: Event): void {
    event.stopPropagation();
    if (!this.item.url) return;

    this.telemetry.track({
      action: 'material.download',
      materialId: this.item._id,
      payload: {
        extension: this.item.extension ?? '',
        aiGenerated: this.item.aiGenerated === true,
      },
    });

    fetch(this.item.url)
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = this.item.name;
        link.click();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        // fallback: apri in nuova tab
        window.open(this.item.url, '_blank');
      });
  }
}
