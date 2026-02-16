import { Component, inject, input, output } from '@angular/core';
import { ClassiService } from '../../../services/classi-service';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  templateUrl: './class-selector.html',
  styleUrl: './class-selector.scss',
})
export class ClassSelector {
  readonly classiService = inject(ClassiService);

  readonly selectedClassIds = input<string[]>([]);
  readonly selectedClassIdsChange = output<string[]>();

  onToggleClass(classId: string): void {
    const UpdatedClasses = this.selectedClassIds().includes(classId)
      ? this.selectedClassIds().filter((id) => id !== classId)
      : [...this.selectedClassIds(), classId];

    this.selectedClassIdsChange.emit(UpdatedClasses);
  }

  isClassSelected(classId: string): boolean {
    return this.selectedClassIds().includes(classId);
  }
}
