import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSave, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { ClassiService } from '../../services/classi-service';
import { ClassSelector } from '../../components/class-selector/class-selector';
import { BackTo } from '../../components/back-to/back-to';
import { MaterialiSelector } from '../../components/materiali-selector/materiali-selector';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';
import {
  ComunicazioniService,
  ComunicazioneInterface,
} from '../../services/comunicazioni-service';
import { MaterialInterface } from '../../services/materiali-service';

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
  SaveIcon = faSave;
  ArrowLeftIcon = faArrowLeft;
  TrashIcon = faTrash;

  comunicazioneForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.required]),
    content: new FormControl('', [Validators.required]),
    classes: new FormControl([], [Validators.required]),
    materials: new FormControl([]),
  });

  comunicazioneId: string | null = null;
  loading = signal<boolean>(false);
  isEdit = signal<boolean>(false);

  get assignedClasses(): string[] {
    return this.comunicazioneForm.get('classes')?.value || [];
  }

  get selectedMaterials(): MaterialInterface[] {
    return this.comunicazioneForm.get('materials')?.value || [];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public classiService: ClassiService,
    private comunicazioniService: ComunicazioniService,
  ) {
    this.comunicazioneId = this.route.snapshot.paramMap.get('comunicazioneId');

    if (this.comunicazioneId) {
      this.isEdit.set(true);
      this.loadComunicazione(this.comunicazioneId);
    }
  }

  private loadComunicazione(id: string): void {
    this.loading.set(true);
    this.comunicazioniService.getComunicazioneById(id).subscribe({
      next: (response) => {
        const comunicazione = response.communication;
        this.comunicazioneForm.patchValue({
          title: comunicazione.title,
          content: comunicazione.content,
          classes: comunicazione.classIds,
          materials: comunicazione.materialIds,
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error(
          'Errore durante il caricamento della comunicazione:',
          error,
        );
        this.loading.set(false);
      },
    });
  }

  onClassesChange(classIds: string[]): void {
    this.comunicazioneForm.get('classes')?.setValue(classIds);
  }

  onMaterialsChange(materials: MaterialInterface[]): void {
    this.comunicazioneForm.get('materials')?.setValue(materials);
  }

  onDelete(): void {
    if (!this.comunicazioneId) return;

    this.loading.set(true);
    this.comunicazioniService
      .deleteComunicazione(this.comunicazioneId)
      .subscribe({
        next: () => {
          console.log('Comunicazione eliminata con successo');
          this.router.navigate(['/t/comunicazioni']);
        },
        error: (error) => {
          console.error(
            "Errore durante l'eliminazione della comunicazione:",
            error,
          );
          this.loading.set(false);
        },
      });
  }

  onSave(): void {
    console.log('Form valid:', this.comunicazioneForm.valid);
    console.log('Form value:', this.comunicazioneForm.value);

    if (this.comunicazioneForm.invalid) {
      console.log('Form invalid, errors:', this.comunicazioneForm.errors);
      this.comunicazioneForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const materials = this.comunicazioneForm.get('materials')?.value || [];
    const materialIds = materials.map((m: MaterialInterface) => m._id);

    const comunicazioneData: ComunicazioneInterface = {
      title: this.comunicazioneForm.get('title')?.value,
      content: this.comunicazioneForm.get('content')?.value,
      classIds: this.comunicazioneForm.get('classes')?.value || [],
      materialIds: materialIds,
      subjectId: '', // Verrà impostato dal service
    };

    console.log('Invio comunicazione:', comunicazioneData);

    const serviceCall = this.isEdit()
      ? this.comunicazioniService.editComunicazione(
          this.comunicazioneId!,
          comunicazioneData,
        )
      : this.comunicazioniService.createComunicazione(comunicazioneData);

    serviceCall.subscribe({
      next: (response) => {
        console.log(
          `Comunicazione ${this.isEdit() ? 'modificata' : 'creata'} con successo:`,
          response.communication,
        );
        this.router.navigate(['/t/comunicazioni']);
      },
      error: (error) => {
        console.error(
          `Errore durante ${this.isEdit() ? 'la modifica' : 'la creazione'} della comunicazione:`,
          error,
        );
        this.loading.set(false);
      },
    });
  }
}
