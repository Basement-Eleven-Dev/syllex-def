import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IconDefinition,
  faClock,
  faArrowRight,
} from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { ComunicazioneInterface } from '../../../services/comunicazioni-service';
import { MaterialInterface } from '../../../services/materiali/materiali-service';
import { FileViewer } from '../.././../teacher/components/file-viewer/file-viewer';
import { getFileIcon } from '../../../app/_utils/file-icons';
import { Materia } from '../../../services/materia';

@Component({
  selector: 'div[app-student-comunicazione-card]',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule, RouterModule],
  templateUrl: './student-comunicazione-card.html',
  styleUrl: './student-comunicazione-card.scss',
})
export class StudentComunicazioneCard implements OnInit {
  @Input() comunicazione!: ComunicazioneInterface;

  protected readonly materiaService = inject(Materia);

  readonly ClockIcon = faClock;
  readonly ArrowIcon = faArrowRight;

  readonly attachments = signal<MaterialInterface[]>([]);
  readonly loading = signal(false);

  constructor(
    private http: HttpClient,
    private modalService: NgbModal,
  ) {}

  isNew(): boolean {
    if (!this.comunicazione?.createdAt) return true;
    const created = new Date(this.comunicazione.createdAt).getTime();
    return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
  }

  ngOnInit(): void {
    const ids = this.comunicazione?.materialIds;
    if (!ids || ids.length === 0) return;

    this.loading.set(true);

    let resolved = 0;
    const results: MaterialInterface[] = [];

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
          error: () => {
            // ignora silenziosamente materiali non accessibili
          },
          complete: () => {
            resolved++;
            if (resolved === ids.length) {
              this.attachments.set(results);
              this.loading.set(false);
            }
          },
        });
    });
  }

  getFileIcon(extension: string): IconDefinition {
    return getFileIcon(extension);
  }

  onRequestAttachmentView(attachment: MaterialInterface): void {
    const modalRef = this.modalService.open(FileViewer, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.docUrl = attachment.url;
    modalRef.componentInstance.extension = attachment.extension;
  }
}
