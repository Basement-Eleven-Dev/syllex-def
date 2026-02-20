import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faPencil,
  faPlus,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Materia, TopicObject } from '../../../services/materia';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-subject-settings-modal',
  imports: [FormsModule, FontAwesomeModule],
  templateUrl: './subject-settings-modal.html',
  styleUrl: './subject-settings-modal.scss',
})
export class SubjectSettingsModal {
  readonly ActiveModal = inject(NgbActiveModal);
  private readonly MateriaService = inject(Materia);
  private readonly feedbackService = inject(FeedbackService);

  readonly PencilIcon = faPencil;
  readonly CheckIcon = faCheck;
  readonly XmarkIcon = faXmark;
  readonly PlusIcon = faPlus;

  readonly Subject = computed(() => this.MateriaService.materiaSelected());
  readonly Topics = computed(() => this.Subject()?.topics ?? []);

  readonly EditingTopicId = signal<string | null>(null);
  readonly EditValue = signal('');
  readonly NewTopicName = signal('');
  readonly IsAdding = signal(false);
  readonly IsSaving = signal(false);
  readonly ErrorMessage = signal<string | null>(null);

  startEdit(topic: TopicObject): void {
    this.EditingTopicId.set(topic._id);
    this.EditValue.set(topic.name);
    this.ErrorMessage.set(null);
  }

  cancelEdit(): void {
    this.EditingTopicId.set(null);
    this.EditValue.set('');
  }

  confirmRename(topicId: string): void {
    const name = this.EditValue().trim();
    const subjectId = this.Subject()?._id;
    if (!name || !subjectId || this.IsSaving()) return;

    this.IsSaving.set(true);
    this.ErrorMessage.set(null);

    this.MateriaService.renameTopic(subjectId, topicId, name).subscribe({
      next: () => {
        this.EditingTopicId.set(null);
        this.EditValue.set('');
        this.IsSaving.set(false);
        this.feedbackService.showFeedback(
          'Argomento rinominato con successo!',
          true,
        );
      },
      error: () => {
        this.ErrorMessage.set('Errore nel rinominare il topic.');
        this.IsSaving.set(false);
        this.feedbackService.showFeedback(
          "Errore nel rinominare l'argomento.",
          false,
        );
      },
    });
  }

  addTopic(): void {
    const name = this.NewTopicName().trim();
    const subjectId = this.Subject()?._id;
    if (!name || !subjectId || this.IsAdding()) return;

    this.IsAdding.set(true);
    this.ErrorMessage.set(null);

    this.MateriaService.addTopic(subjectId, name).subscribe({
      next: () => {
        this.NewTopicName.set('');
        this.IsAdding.set(false);
        this.feedbackService.showFeedback(
          'Argomento aggiunto con successo!',
          true,
        );
      },
      error: () => {
        this.ErrorMessage.set("Errore nell'aggiunta dell'argomento.");
        this.IsAdding.set(false);
        this.feedbackService.showFeedback(
          "Errore nell'aggiunta dell'argomento.",
          false,
        );
      },
    });
  }

  onEditKeydown(event: KeyboardEvent, topicId: string): void {
    if (event.key === 'Enter') this.confirmRename(topicId);
    if (event.key === 'Escape') this.cancelEdit();
  }

  onAddKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addTopic();
  }
}
