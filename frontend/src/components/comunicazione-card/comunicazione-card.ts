import { Component, Input } from '@angular/core';
import { Comunicazione } from '../../pages/comunicazioni/comunicazioni';
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

@Component({
  selector: 'div[app-comunicazione-card]',
  imports: [DatePipe, FontAwesomeModule, ConfirmActionDirective, RouterModule],
  templateUrl: './comunicazione-card.html',
  styleUrl: './comunicazione-card.scss',
})
export class ComunicazioneCard {
  TrashIcon = faTrash;
  EditIcon = faMarker;
  @Input() comunicazione!: Comunicazione;

  onDelete() {}

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  onRequestAttachmentView(attachmentId: number) {
    console.log('Requesting view for attachment ID:', attachmentId);
    // Implement the logic to view/download the attachment here
  }
}
