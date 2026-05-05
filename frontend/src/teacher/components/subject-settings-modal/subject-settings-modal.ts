import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faPencil,
  faPlus,
  faXmark,
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Materia, TopicObject } from '../../../services/materia';
import { FeedbackService } from '../../../services/feedback-service';
import { QuestionsService } from '../../../services/questions';

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
  private readonly questionService = inject(QuestionsService);

  readonly PencilIcon = faPencil;
  readonly CheckIcon = faCheck;
  readonly XmarkIcon = faXmark;
  readonly PlusIcon = faPlus;
  readonly TrashIcon = faTrash;

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

deleteTopic(topicId: string): void {
  const subjectId = this.Subject()?._id;
  if (!subjectId) return;

  // 1. Controlliamo se ci sono domande associate
  this.questionService.hasQuestions(topicId).subscribe({
    next: (hasQuestions) => {
      if (hasQuestions) {
        // 2. Se ci sono domande, mostriamo l'alert e interrompiamo
        alert("Non è possibile eliminare l'argomento perché ci sono domande associate.");
        return;
      }

      // 3. Se non ci sono domande, chiediamo conferma per l'eliminazione dell'argomento
      if (!confirm(`Sei sicuro di voler eliminare questo argomento?`)) return;

      this.MateriaService.deleteTopic(subjectId, topicId).subscribe({
        next: () => {
          this.feedbackService.showFeedback('Argomento eliminato con successo!', true);
         
        },
        error: () => {
          this.feedbackService.showFeedback("Errore nell'eliminare l'argomento.", false);
        }
      });
    },
    error: () => {
      this.feedbackService.showFeedback("Errore nel controllo delle domande associate.", false);
    }
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
