import { Component, inject, signal, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClassSelector } from '../class-selector/class-selector';
import { TestsService, TestInterface } from '../../services/tests-service';
import {
  MaterialiService,
  MaterialInterface,
} from '../../services/materiali-service';
import { ClassiService } from '../../services/classi-service';

type ResourceType = 'test' | 'material';
type Resource = TestInterface | MaterialInterface;

@Component({
  selector: 'app-assign-class',
  imports: [ClassSelector],
  templateUrl: './assign-class.html',
  styleUrl: './assign-class.scss',
})
export class AssignClass implements OnInit {
  private readonly modal = inject(NgbActiveModal);
  private readonly testsService = inject(TestsService);
  private readonly materialsService = inject(MaterialiService);
  readonly classiService = inject(ClassiService);

  // Public properties for NgbModal compatibility
  resourceType!: ResourceType;
  resource!: Resource;

  readonly SelectedClassIds = signal<string[]>([]);
  readonly IsSaving = signal<boolean>(false);
  readonly ErrorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const initialClassIds = this.resource.classIds || [];
    this.SelectedClassIds.set(initialClassIds);
  }

  onClassSelectionChange(classIds: string[]): void {
    this.SelectedClassIds.set(classIds);
  }

  saveAssignment(): void {
    this.IsSaving.set(true);
    this.ErrorMessage.set(null);

    const resourceId = this.resource._id;
    if (!resourceId) {
      this.ErrorMessage.set('Resource ID is missing');
      this.IsSaving.set(false);
      return;
    }

    if (this.resourceType === 'test') {
      this.testsService
        .updateClassIds(resourceId, this.SelectedClassIds())
        .subscribe({
          next: (response) => {
            // Update local resource object
            this.resource.classIds = this.SelectedClassIds();
            this.IsSaving.set(false);
            this.modal.close({
              classIds: this.SelectedClassIds(),
              resource: response.test,
            });
          },
          error: (err: unknown) => {
            console.error('Error updating class assignment:', err);
            this.ErrorMessage.set('Failed to update class assignment');
            this.IsSaving.set(false);
          },
        });
    } else {
      this.materialsService
        .updateClassIds(resourceId, this.SelectedClassIds())
        .subscribe({
          next: (response) => {
            // Update local resource object
            this.resource.classIds = this.SelectedClassIds();
            this.IsSaving.set(false);
            this.modal.close({
              classIds: this.SelectedClassIds(),
              resource: response.material,
            });
          },
          error: (err: unknown) => {
            console.error('Error updating class assignment:', err);
            this.ErrorMessage.set('Failed to update class assignment');
            this.IsSaving.set(false);
          },
        });
    }
  }

  cancel(): void {
    this.modal.dismiss();
  }
}
