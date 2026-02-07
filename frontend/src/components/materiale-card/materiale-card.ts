import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  input,
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
} from '../../app/_utils/file-icons';
import { faEllipsisVertical, faRobot } from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { MaterialeContextualMenu } from '../materiale-contextual-menu/materiale-contextual-menu';
import { MaterialInterface } from '../../services/materiali-service';

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
  @Input() item!: MaterialInterface;
  @Input() highlightedItemId: string | null = null;
  @Input() isSelected: boolean = false;

  @Output() openItem = new EventEmitter<MaterialInterface>();
  @Output() renameItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<void>();
  @Output() selectItemEvent = new EventEmitter<MouseEvent>();

  readonly ThreeDotsIcon = faEllipsisVertical;
  readonly RobotIcon = faRobot;

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

  selectItem(event: MouseEvent): void {
    event.stopPropagation();
    this.selectItemEvent.emit(event);
  }
}
