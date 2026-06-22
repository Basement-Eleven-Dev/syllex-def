import { Component, computed, DestroyRef, inject, signal, Input, OnInit } from '@angular/core';
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
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../services/feedback-service';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
    SyllexButton,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './create-edit-comunicazione.html',
  styleUrl: './create-edit-comunicazione.scss',
})
export class CreateEditComunicazione implements OnInit {
  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly classiService = inject(ClassiService);
  private readonly comunicazioniService = inject(ComunicazioniService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  readonly activeModal = inject(NgbActiveModal, { optional: true });

  // Icons
  readonly SaveIcon = faSave;
  readonly TrashIcon = faTrash;

  // Input
  @Input() comunicazioneId: string | null = null;

  // UI State
  readonly IsLoading = signal<boolean>(false);
  readonly MaterialIds = signal<string[]>([]);

  // Computed
  readonly IsEditMode = computed(() => !!this.comunicazioneId);
  readonly PageTitle = computed(() =>
    this.IsEditMode() ? this.translocoService.translate('com_modal.title_edit') : this.translocoService.translate('com_modal.title_new'),
  );
  readonly PageDescription = computed(() =>
    this.IsEditMode()
      ? this.translocoService.translate('com_modal.desc_edit')
      : this.translocoService.translate('com_modal.desc_new'),
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

  ngOnInit(): void {
    if (!this.comunicazioneId) {
      this.comunicazioneId = this.route.snapshot.paramMap.get('comunicazioneId');
    }
    if (this.comunicazioneId) {
      this.loadComunicazione(this.comunicazioneId);
    }
  }

  private loadComunicazione(id: string): void {
    this.IsLoading.set(true);
    this.comunicazioniService
      .getComunicazioneById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.populateFormWithComunicazione(response.communication);
          this.IsLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading communication:', error);
          this.feedbackService.showFeedback(
            this.translocoService.translate('com_modal.error_load'),
            false,
          );
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
    if (!this.comunicazioneId) return;

    this.IsLoading.set(true);
    this.comunicazioniService
      .deleteComunicazione(this.comunicazioneId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedbackService.showFeedback(
            this.translocoService.translate('com_modal.success_delete'),
            true,
          );
          if (this.activeModal) {
            this.activeModal.close(true);
          } else {
            this.router.navigate(['/t/calendario']);
          }
        },
        error: (error) => {
          console.error('Error deleting communication:', error);
          this.feedbackService.showFeedback(
            this.translocoService.translate('com_modal.error_delete'),
            false,
          );
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
          this.comunicazioneId!,
          comunicazioneData,
        )
      : this.comunicazioniService.createComunicazione(comunicazioneData);

    serviceCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.feedbackService.showFeedback(
          this.IsEditMode()
            ? this.translocoService.translate('com_modal.success_update')
            : this.translocoService.translate('com_modal.success_create'),
          true,
        );
        if (this.activeModal) {
          this.activeModal.close(true);
        } else {
          this.router.navigate(['/t/calendario']);
        }
      },
      error: (error) => {
        console.error('Error saving communication:', error);
        this.feedbackService.showFeedback(
          this.translocoService.translate('com_modal.error_save'),
          false,
        );
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
