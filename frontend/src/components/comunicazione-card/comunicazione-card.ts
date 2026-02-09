import { Component, EventEmitter, Input, Output, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  faMarker,
  faTrash,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';
import { RouterModule } from '@angular/router';
import { getFileIcon } from '../../app/_utils/file-icons';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../services/comunicazioni-service';
import {
  MaterialInterface,
  MaterialiService,
} from '../../services/materiali-service';
import { FeedbackService } from '../../services/feedback-service';

@Component({
  selector: 'div[app-comunicazione-card]',
  imports: [DatePipe, FontAwesomeModule, ConfirmActionDirective, RouterModule],
  templateUrl: './comunicazione-card.html',
  styleUrl: './comunicazione-card.scss',
})
export class ComunicazioneCard {
  TrashIcon = faTrash;
  EditIcon = faMarker;
  @Input() comunicazione!: ComunicazioneInterface;

  attachments: MaterialInterface[] = [];

  constructor(
    private materialiService: MaterialiService,
    private comunicazioniService: ComunicazioniService,
    private feedbackService: FeedbackService,
  ) {
    // Reagisci ai cambiamenti del tree dei materiali
    effect(() => {
      const root = this.materialiService.root();
      if (root.length > 0 && this.comunicazione?.materialIds) {
        this.attachments = this.comunicazione.materialIds
          .map((id) => this.materialiService.getMaterialById(id))
          .filter((m): m is MaterialInterface => m !== undefined);
      }
    });
  }

  @Output() deleted = new EventEmitter<string>();
  onDelete() {
    this.comunicazioniService
      .deleteComunicazione(this.comunicazione._id!)
      .subscribe({
        next: (response) => {
          console.log('Comunicazione eliminata con successo:', response);
          this.feedbackService.showFeedback(
            'Comunicazione eliminata con successo',
            true,
          );
          this.deleted.emit(this.comunicazione._id!);
        },
        error: (error) => {
          console.error(
            "Errore durante l'eliminazione della comunicazione:",
            error,
          );
          this.feedbackService.showFeedback(
            "Errore durante l'eliminazione della comunicazione",
            false,
          );
        },
      });
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  onRequestAttachmentView(attachmentId: string) {
    console.log('Requesting view for attachment ID:', attachmentId);
    // Implement the logic to view/download the attachment here
  }
}
