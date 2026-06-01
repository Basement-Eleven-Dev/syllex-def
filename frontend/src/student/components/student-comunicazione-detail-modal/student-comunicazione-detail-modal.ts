import { Component, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faPaperclip,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { FileViewer } from '../../../teacher/components/file-viewer/file-viewer';
import { getFileIcon } from '../../../app/_utils/file-icons';

@Component({
  selector: 'app-student-comunicazione-detail-modal',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule],
  templateUrl: './student-comunicazione-detail-modal.html',
  styleUrl: './student-comunicazione-detail-modal.scss',
})
export class StudentComunicazioneDetailModal implements OnInit {
  @Input() comunicazioneId!: string;

  readonly ClockIcon = faClock;
  readonly AttachIcon = faPaperclip;

  readonly loading = signal(true);
  readonly comunicazione = signal<ComunicazioneInterface | null>(null);
  readonly attachments = signal<MaterialInterface[]>([]);

  constructor(
    public activeModal: NgbActiveModal,
    private comunicazioniService: ComunicazioniService,
    private http: HttpClient,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.comunicazioniService
      .getComunicazioneById(this.comunicazioneId)
      .subscribe({
        next: (res) => {
          this.comunicazione.set(res.communication);
          this.loading.set(false);
          this.loadAttachments(res.communication.materialIds ?? []);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private loadAttachments(ids: string[]): void {
    if (!ids.length) return;
    const results: MaterialInterface[] = [];
    let resolved = 0;
    ids.forEach((id) => {
      this.http
        .get<{
          success: boolean;
          material: MaterialInterface;
        }>(`materials/${id}`)
        .subscribe({
          next: (res) => {
            if (res.material) results.push(res.material);
          },
          complete: () => {
            resolved++;
            if (resolved === ids.length) this.attachments.set(results);
          },
        });
    });
  }

  openAttachment(attachment: MaterialInterface): void {
    const modalRef = this.modalService.open(FileViewer, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.docUrl = attachment.url;
    modalRef.componentInstance.extension = attachment.extension;
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }
}
