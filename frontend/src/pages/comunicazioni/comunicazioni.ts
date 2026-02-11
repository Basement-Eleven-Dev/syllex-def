import { Component, signal, computed, effect, inject } from '@angular/core';
import { Materia } from '../../services/materia';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
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
  // Icons
  protected readonly PlusIcon = faPlus;
  protected readonly ClearIcon = faXmark;

  // Dependency Injection
  protected readonly materiaService = inject(Materia);
  protected readonly classiService = inject(ClassiService);
  private readonly comunicazioniService = inject(ComunicazioniService);

  // Signals
  private RawComunicazioni = signal<ComunicazioneInterface[]>([]);
  Page = signal(1);
  PageSize = signal(10);
  CollectionSize = signal(0);
  SearchTerm = signal('');
  SelectedClassId = signal('');
  SelectedHasAttachments = signal('');

  Comunicazioni = computed<ComunicazioneInterface[]>(() => {
    return this.RawComunicazioni();
  });

  constructor() {
    effect(() => {
      const currentSearchTerm = this.SearchTerm();
      const currentClassId = this.SelectedClassId();
      const currentHasAttachments = this.SelectedHasAttachments();
      const currentPage = this.Page();
      const currentPageSize = this.PageSize();

      this.loadComunicazioni(
        currentSearchTerm,
        currentClassId,
        currentHasAttachments,
        currentPage,
        currentPageSize,
      );
    });
  }

  clearFilters(): void {
    this.SearchTerm.set('');
    this.SelectedClassId.set('');
    this.SelectedHasAttachments.set('');
    this.Page.set(1);
  }

  onSearchTermChange(term: string): void {
    this.SearchTerm.set(term);
    this.Page.set(1);
  }

  onClassFilterChange(classId: string): void {
    this.SelectedClassId.set(classId);
    this.Page.set(1);
  }

  onAttachmentsFilterChange(value: string): void {
    this.SelectedHasAttachments.set(value);
    this.Page.set(1);
  }

  onComunicazioneDeleted($event: string): void {
    this.RawComunicazioni.set(
      this.RawComunicazioni().filter((c) => c._id !== $event),
    );
    this.CollectionSize.set(this.CollectionSize() - 1);
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
          this.RawComunicazioni.set(response.communications);
          this.CollectionSize.set(response.total);
        },
        error: (err) => {
          console.error('Errore nel caricamento delle comunicazioni:', err);
        },
      });
  }
}
