import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ClassiService } from '../../services/classi-service';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  templateUrl: './class-selector.html',
  styleUrl: './class-selector.scss',
})
export class ClassSelector {
  @Input() selectedClassIds: string[] = [];
  @Output() selectedClassIdsChange = new EventEmitter<string[]>();

  constructor(public classiService: ClassiService) {}

  onToggleClass(classId: string): void {
    const updatedClasses = this.selectedClassIds.includes(classId)
      ? this.selectedClassIds.filter((id) => id !== classId)
      : [...this.selectedClassIds, classId];

    this.selectedClassIdsChange.emit(updatedClasses);
  }

  isClassSelected(classId: string): boolean {
    return this.selectedClassIds.includes(classId);
  }
}
