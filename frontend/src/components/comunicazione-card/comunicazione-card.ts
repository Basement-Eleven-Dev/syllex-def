import { Component, Input } from '@angular/core';
import { Comunicazione } from '../../pages/comunicazioni/comunicazioni';
import { DatePipe } from '@angular/common';
import {
  faFile,
  faFileExcel,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFileWord,
  faMarker,
  faTrash,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmActionDirective } from '../../directives/confirm-action.directive';

@Component({
  selector: 'div[app-comunicazione-card]',
  imports: [DatePipe, FontAwesomeModule, ConfirmActionDirective],
  templateUrl: './comunicazione-card.html',
  styleUrl: './comunicazione-card.scss',
})
export class ComunicazioneCard {
  TrashIcon = faTrash;
  EditIcon = faMarker;
  @Input() comunicazione!: Comunicazione;

  onDelete() {}

  getFileIcon(extension: string): IconDefinition {
    switch (extension) {
      case 'pdf':
        return faFilePdf;
      case 'docx':
        return faFileWord;
      case 'xlsx':
        return faFileExcel;
      case 'png':
      case 'jpg':
        return faFileImage;
      case 'txt':
        return faFileLines;
      default:
        return faFile;
    }
  }

  onRequestAttachmentView(attachmentId: number) {
    console.log('Requesting view for attachment ID:', attachmentId);
    // Implement the logic to view/download the attachment here
  }
}
