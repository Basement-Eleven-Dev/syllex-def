import { Component, signal, computed, effect } from '@angular/core';
import { Materia } from '../../services/materia';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ComunicazioneCard } from '../../components/comunicazione-card/comunicazione-card';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
  ComunicazioniService,
  ComunicazioneInterface,
} from '../../services/comunicazioni-service';
import { ClassiService } from '../../services/classi-service';

interface Attachment {
  id: number;
  filename: string;
  url: string;
  extension: 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'txt';
}

export interface Comunicazione {
  id: string;
  titolo: string;
  contenuto: string;
  dataCreazione: Date;
  attachments?: Attachment[];
  classes: string[];
}

@Component({
  selector: 'app-comunicazioni',
  imports: [
    FontAwesomeModule,
    ComunicazioneCard,
    RouterModule,
    NgbPagination,
    FormsModule,
  ],
  templateUrl: './comunicazioni.html',
  styleUrl: './comunicazioni.scss',
})
export class Comunicazioni {
  PlusIcon = faPlus;

  // Signals per state management
  private rawComunicazioni = signal<ComunicazioneInterface[]>([]);

  // Pagination signals
  page = signal(1);
  pageSize = signal(10);
  collectionSize = signal(0);

  // Filter signals
  searchTerm = signal('');
  selectedClassId = signal('');
  selectedHasAttachments = signal('');

  // Computed per convertire ComunicazioneInterface -> Comunicazione
  comunicazioni = computed<Comunicazione[]>(() => {
    return this.rawComunicazioni().map((c) => ({
      id: c._id || '',
      titolo: c.title,
      contenuto: c.content,
      dataCreazione: c.createdAt ? new Date(c.createdAt) : new Date(),
      attachments: [], // TODO: mappare correttamente i materiali
      classes: c.classIds,
    }));
  });

  constructor(
    public materiaService: Materia,
    private comunicazioniService: ComunicazioniService,
    public classiService: ClassiService,
  ) {
    // Effect che triggera il load quando cambiano filtri o paginazione
    effect(() => {
      const currentSearchTerm = this.searchTerm();
      const currentClassId = this.selectedClassId();
      const currentHasAttachments = this.selectedHasAttachments();
      const currentPage = this.page();
      const currentPageSize = this.pageSize();

      this.loadComunicazioni(
        currentSearchTerm,
        currentClassId,
        currentHasAttachments,
        currentPage,
        currentPageSize,
      );
    });
  }

  private loadComunicazioni(
    searchTerm: string,
    classId: string,
    hasAttachments: string,
    page: number,
    pageSize: number,
  ): void {
    this.comunicazioniService
      .getPagedComunicazioni(
        searchTerm,
        classId,
        hasAttachments,
        page,
        pageSize,
      )
      .subscribe({
        next: (response) => {
          this.rawComunicazioni.set(response.communications);
          this.collectionSize.set(response.total);
        },
        error: (err) => {
          console.error('Errore nel caricamento delle comunicazioni:', err);
        },
      });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
    this.page.set(1);
  }

  onClassFilterChange(classId: string): void {
    this.selectedClassId.set(classId);
    this.page.set(1);
  }

  onAttachmentsFilterChange(value: string): void {
    this.selectedHasAttachments.set(value);
    this.page.set(1);
  }

  onNewPageRequested(): void {
    // La gestione è automatica tramite il two-way binding e l'effect
  }
}
