import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FaIconComponent,
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import {
  getFileIcon,
  getFolderIcon,
  getIconColor,
} from '../../app/_utils/file-icons';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { MaterialeContextualMenu } from '../materiale-contextual-menu/materiale-contextual-menu';
import { Folder, Materiale } from '../../services/materiali-service';

@Component({
  selector: 'app-materiale-card',
  imports: [
    FaIconComponent,
    FontAwesomeModule,
    MaterialeContextualMenu,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
  ],
  templateUrl: './materiale-card.html',
  styleUrl: './materiale-card.scss',
})
export class MaterialeCard {
  Icon?: IconDefinition;
  ThreeDotsIcon = faEllipsisVertical;
  color: string = '#4A5568'; // Default color
  isFolder: boolean = false;
  itemsInFolder: number = 0;
  totalItemsCount: number = 0;
  @Input() item!: Folder | Materiale;
  @Input() highlightedItemId: string | null = null;
  @Input() isSelected: boolean = false;

  get folderContentLength(): number {
    return this.isFolder ? (this.item as Folder).content.length : 0;
  }

  @Output() openItem: EventEmitter<Folder | Materiale> = new EventEmitter();
  @Output() renameItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<void>();
  @Output() selectItemEvent: EventEmitter<MouseEvent> = new EventEmitter();

  selectItem(event: MouseEvent): void {
    event.stopPropagation();
    this.selectItemEvent.emit(event);
  }

  checkType(): boolean {
    return 'content' in this.item;
  }

  ngOnInit() {
    this.isFolder = this.checkType();
    if (this.isFolder) {
      this.Icon = getFolderIcon(false);
      this.color = getIconColor('folder');
    } else {
      this.Icon = getFileIcon((this.item as Materiale).extension!);
      this.color = getIconColor((this.item as Materiale).extension!);
    }
  }
}
