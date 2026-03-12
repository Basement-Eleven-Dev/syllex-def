import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MaterialiFacadeService } from '../../../services/materiali/materiali-facade.service';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark, faSparkles } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-suggested-topics-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './suggested-topics-modal.html',
  styleUrl: './suggested-topics-modal.scss',
})
export class SuggestedTopicsModal {
  readonly activeModal = inject(NgbActiveModal);
  public readonly facade = inject(MaterialiFacadeService);

  @Input() topics: string[] = [];

  protected readonly icons = {
    plus: faPlus,
    clear: faXmark,
    sparkles: faSparkles,
  };

  onAdd(topic: string): void {
    this.facade.addSuggestedTopic(topic).subscribe({
      next: () => {
        // topics are filtered out by facade.addSuggestedTopic
        if (this.facade.suggestedTopics().length === 0) {
          this.activeModal.close();
        }
      },
    });
  }

  onDismiss(topic: string): void {
    this.facade.dismissSuggestedTopic(topic);
    if (this.facade.suggestedTopics().length === 0) {
      this.activeModal.close();
    }
  }

  onClose(): void {
    this.facade.suggestedTopics.set([]);
    this.activeModal.dismiss();
  }
}
