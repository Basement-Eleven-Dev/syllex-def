import {
  Component,
  signal,
  OnInit,
  effect,
  computed,
  output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFile,
  faPlus,
  faSave,
  faXmark,
  faSpinner,
} from '@fortawesome/pro-regular-svg-icons';
import { getFileIcon, getIconColor } from '../../../app/_utils/file-icons';
import { FileViewer } from '../file-viewer/file-viewer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';

import { firstValueFrom } from 'rxjs';
import {
  MaterialInterface,
  MaterialiService,
} from '../../../services/materiali-service';
import { EmbeddingsService } from '../../../services/embeddings.service';
import { Materia } from '../../../services/materia';
import { AgentService } from '../../../services/agent.service';

@Component({
  selector: 'app-agent-settings-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MaterialiSelector,
  ],
  templateUrl: './agent-settings-form.html',
  styleUrl: './agent-settings-form.scss',
})
export class AgentSettingsForm implements OnInit {
  onSave() {
    throw new Error('Method not implemented.');
  }
  FileIcon = faFile;
  XmarkIcon = faXmark;
  SaveIcon = faSave;
  PlusIcon = faPlus;
  SpinnerIcon = faSpinner;

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  assistantId = signal<string | null>(null);
  associatedMaterialIds = signal<string[]>([]);

  assistantLoaded = output<string | null>();

  isUpdateMode = computed(() => !!this.assistantId());

  agentSettingsForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    tone: new FormControl('friendly', [Validators.required]),
    voice: new FormControl(''),
  });

  tone: 'friendly' | 'formal' | 'concise' | 'detailed' = 'friendly';
  name: string = '';
  files: File[] = [];
  selectedMaterials: MaterialInterface[] = [];

  getFileIcon(fileName: string) {
    console.log('Getting icon for file:', fileName);
    let extension = fileName.split('.').pop()?.toLowerCase() || '';
    return getFileIcon(extension);
  }

  getFileIconColor(fileName: string) {
    let extension = fileName.split('.').pop()?.toLowerCase() || '';
    return getIconColor(extension);
  }

  constructor(
    private modalService: NgbModal,
    private embeddingsService: EmbeddingsService,
    private materiaService: Materia,
    private agentService: AgentService,
    private materialiService: MaterialiService,
  ) {
    effect(() => {
      const subject = this.materiaService.materiaSelected();
      if (subject?._id) {
        this.loadAssistant();
      } else {
        this.resetForm();
      }
    });
  }

  ngOnInit() {
    // Logic moved to effect for reactivity, but OnInit is good practice
  }

  private loadAssistant() {
    this.isLoading.set(true);
    this.agentService.getAssistant().subscribe({
      next: (res) => {
        if (res.exists && res.assistant) {
          // Handle both string and ObjectId serialization ({$oid: ...})
          const id = res.assistant._id?.$oid || res.assistant._id;
          this.assistantId.set(id);
          this.assistantLoaded.emit(id);

          this.agentSettingsForm.patchValue({
            name: res.assistant.name,
            tone: res.assistant.tone || 'friendly',
            voice: res.assistant.voice || '',
          });

          const associatedIds =
            res.assistant.associatedFileIds?.map((id: any) => id.$oid || id) ||
            [];
          this.associatedMaterialIds.set(associatedIds);
        } else {
          this.resetForm();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading assistant:', err);
        this.isLoading.set(false);
      },
    });
  }

  private resetForm() {
    this.assistantId.set(null);
    this.assistantLoaded.emit(null);
    this.associatedMaterialIds.set([]);
    this.agentSettingsForm.reset({
      tone: 'friendly',
      voice: '',
    });
  }

  onRemoveMaterial(materialId: string) {
    const assistantId = this.assistantId();
    if (!assistantId) return;

    this.agentService.removeMaterial(assistantId, materialId).subscribe({
      next: (res) => {
        if (res.success) {
          this.associatedMaterialIds.update((ids) =>
            ids.filter((id) => id !== materialId),
          );
          this.materialiService.loadMaterials();
        }
      },
      error: (err) => console.error('Error removing material:', err),
    });
  }

  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles: File[] = Array.from(selectedFiles);
      this.files.push(...newFiles);
      event.target.value = '';
    }
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  onRequestViewFile(file: File) {
    const fileURL = URL.createObjectURL(file);
    this.modalService.open(FileViewer, {
      size: 'lg',
      centered: true,
      scrollable: true,
    }).componentInstance.docUrl = fileURL;
  }

  onMaterialSelectionChange(materials: MaterialInterface[]) {
    this.selectedMaterials = materials;
    console.log(
      'Selected materials in AgentSettingsForm:',
      this.selectedMaterials,
    );
  }

  async onSubmit() {
    if (this.agentSettingsForm.valid) {
      const formData = {
        ...this.agentSettingsForm.value,
        materialIds: this.selectedMaterials.map((m) => m._id),
      };

      try {
        this.isSaving.set(true);
        console.log('Form submission started with data:', formData);

        let assistantId = this.assistantId();

        if (assistantId) {
          // UPDATE
          await firstValueFrom(
            this.agentService.updateAgent(assistantId, formData),
          );
          console.log('Agent updated successfully');
        } else {
          // CREATE
          const response = await firstValueFrom(
            this.agentService.createAgent(formData),
          );
          assistantId = response.assistantId;
          this.assistantId.set(assistantId);
          this.assistantLoaded.emit(assistantId);
          console.log('Agent created successfully, ID:', assistantId);
        }

        // 2. Se ci sono materiali selezionati, vettorizzali associandoli all'assistente
        if (this.selectedMaterials.length > 0 && assistantId) {
          this.embeddingsService
            .vectorizeMaterials(formData.materialIds, assistantId)
            .subscribe({
              next: (res) => {
                console.log('Vectorization successful:', res);
                this.finishSave();
              },
              error: (err) => {
                console.error('Vectorization error:', err);
                this.isSaving.set(false);
              },
            });
        } else {
          this.finishSave();
        }
      } catch (error) {
        console.error('Error during agent save or vectorization:', error);
        this.isSaving.set(false);
      }
    } else {
      console.log('Form is invalid');
    }
  }

  private finishSave() {
    // Ricarica i materiali (per aggiornare i flag isVectorized)
    this.materialiService.loadMaterials();
    // Ricarica l'assistente per sicurezza
    this.loadAssistant();
    this.isSaving.set(false);
  }
}
