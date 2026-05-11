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
import { faSpinner } from '@fortawesome/pro-regular-svg-icons';
import { getFileIcon, getIconColor } from '../../../app/_utils/file-icons';
import { CommonModule } from '@angular/common';

import { firstValueFrom } from 'rxjs';
import {
  MaterialInterface,
  MaterialiService,
} from '../../../services/materiali/materiali-service';
import { Materia } from '../../../services/materia';
import { AgentService } from '../../../services/agent.service';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-agent-settings-form',
  imports: [FormsModule, ReactiveFormsModule, FontAwesomeModule, CommonModule],
  templateUrl: './agent-settings-form.html',
  styleUrl: './agent-settings-form.scss',
})
export class AgentSettingsForm implements OnInit {
  onSave() {
    throw new Error('Method not implemented.');
  }
  SpinnerIcon = faSpinner;

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  assistantId = signal<string | null>(null);
  associatedMaterialIds = signal<string[]>([]);

  // Lista piatta di tutti i materiali della materia (solo file, non cartelle)
  allSubjectMaterials = computed(() => {
    const flatten = (items: MaterialInterface[]): MaterialInterface[] =>
      items.flatMap((item) =>
        item.type === 'folder' && item.content ? flatten(item.content) : [item],
      );
    return flatten(this.materialiService.root());
  });

  assistantSaved = output<string | null>(); // Emesso solo al salvataggio riuscito o reset

  isUpdateMode = computed(() => !!this.assistantId());

  agentSettingsForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    tone: new FormControl('friendly', [Validators.required]),
    voice: new FormControl(''),
  });

  tone: 'friendly' | 'formal' | 'concise' | 'detailed' = 'friendly';
  name: string = '';

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
    private materiaService: Materia,
    private agentService: AgentService,
    private materialiService: MaterialiService,
    private feedbackService: FeedbackService,
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
        this.feedbackService.showFeedback(
          "Errore nel caricamento dell'assistente",
          false,
        );
        this.isLoading.set(false);
      },
    });
  }

  private resetForm() {
    this.assistantId.set(null);
    this.assistantSaved.emit(null);
    this.associatedMaterialIds.set([]);
    this.agentSettingsForm.reset({
      tone: 'friendly',
      voice: '',
    });
  }

  async onSubmit() {
    if (this.agentSettingsForm.valid) {
      const formData = { ...this.agentSettingsForm.value };

      try {
        this.isSaving.set(true);

        let assistantId = this.assistantId();

        if (assistantId) {
          await firstValueFrom(this.agentService.updateAgent(formData));
        } else {
          const response = await firstValueFrom(
            this.agentService.createAgent(formData),
          );
          assistantId = response.assistantId;
          this.assistantId.set(assistantId);
        }

        if (assistantId) this.assistantSaved.emit(assistantId);
        this.isSaving.set(false);
      } catch (error) {
        console.error('Error during agent save:', error);
        this.feedbackService.showFeedback(
          "Errore durante il salvataggio dell'assistente",
          false,
        );
        this.isSaving.set(false);
      }
    }
  }
}
