import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { ClassiService } from '../../../services/classi-service';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { BackTo } from '../../components/back-to/back-to';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';
import {
  ComunicazioniService,
  ComunicazioneInterface,
} from '../../../services/comunicazioni-service';
import { MaterialInterface } from '../../../services/materiali-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-create-edit-comunicazione',
  standalone: true,
  imports: [
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    ClassSelector,
    RouterModule,
    BackTo,
    MaterialiSelector,
    ConfirmActionDirective,
  ],
  templateUrl: './create-edit-comunicazione.html',
  styleUrl: './create-edit-comunicazione.scss',
})
export class CreateEditComunicazione {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly classiService = inject(ClassiService);
  private readonly comunicazioniService = inject(ComunicazioniService);

  // Icons
  readonly SaveIcon = faSave;
  readonly TrashIcon = faTrash;

  // Data
  private readonly ComunicazioneId: string | null =
    this.route.snapshot.paramMap.get('comunicazioneId');

  // UI State
  readonly IsLoading = signal<boolean>(false);
  readonly MaterialIds = signal<string[]>([]);

  // Computed
  readonly IsEditMode = computed(() => !!this.ComunicazioneId);
  readonly PageTitle = computed(() =>
    this.IsEditMode() ? 'Modifica' : 'Nuova',
  );
  readonly PageDescription = computed(() =>
    this.IsEditMode()
      ? 'Modifica comunicazione ai tuoi studenti.'
      : 'Crea una nuova comunicazione ai tuoi studenti.',
  );

  readonly ComunicazioneForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    content: new FormControl('', [Validators.required]),
    classes: new FormControl([], [Validators.required]),
    materials: new FormControl([]),
  });

  get assignedClasses(): string[] {
    return this.ComunicazioneForm.get('classes')?.value || [];
  }

  get selectedMaterials(): MaterialInterface[] {
    return this.ComunicazioneForm.get('materials')?.value || [];
  }

  constructor() {
    if (this.ComunicazioneId) {
      this.loadComunicazione(this.ComunicazioneId);
    }
  }

  private loadComunicazione(id: string): void {
    this.IsLoading.set(true);
    this.comunicazioniService
      .getComunicazioneById(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          this.populateFormWithComunicazione(response.communication);
          this.IsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading communication:', error);
          this.IsLoading.set(false);
        },
      });
  }

  private populateFormWithComunicazione(comunicazione: any): void {
    this.ComunicazioneForm.patchValue({
      title: comunicazione.title,
      content: comunicazione.content,
      classes: comunicazione.classIds,
    });
    this.MaterialIds.set(comunicazione.materialIds || []);
  }

  onClassesChange(classIds: string[]): void {
    this.ComunicazioneForm.get('classes')?.setValue(classIds);
  }

  onMaterialsChange(materials: MaterialInterface[]): void {
    this.ComunicazioneForm.get('materials')?.setValue(materials);
  }

  onDelete(): void {
    if (!this.ComunicazioneId) return;

    this.IsLoading.set(true);
    this.comunicazioniService
      .deleteComunicazione(this.ComunicazioneId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.router.navigate(['/t/comunicazioni']);
        },
        error: (error) => {
          console.error('Error deleting communication:', error);
          this.IsLoading.set(false);
        },
      });
  }

  onSave(): void {
    if (this.ComunicazioneForm.invalid) {
      this.ComunicazioneForm.markAllAsTouched();
      return;
    }

    this.IsLoading.set(true);
    const comunicazioneData = this.prepareComunicazioneData();
    const serviceCall = this.IsEditMode()
      ? this.comunicazioniService.editComunicazione(
          this.ComunicazioneId!,
          comunicazioneData,
        )
      : this.comunicazioniService.createComunicazione(comunicazioneData);

    serviceCall.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.router.navigate(['/t/comunicazioni']);
      },
      error: (error) => {
        console.error('Error saving communication:', error);
        this.IsLoading.set(false);
      },
    });
  }

  private prepareComunicazioneData(): ComunicazioneInterface {
    const materials = this.ComunicazioneForm.get('materials')?.value || [];
    const materialIds = materials.map((m: MaterialInterface) => m._id);

    return {
      title: this.ComunicazioneForm.get('title')?.value,
      content: this.ComunicazioneForm.get('content')?.value,
      classIds: this.ComunicazioneForm.get('classes')?.value || [],
      materialIds: materialIds,
      subjectId: '',
    };
  }
}
