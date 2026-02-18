import { Component, effect, inject, signal } from '@angular/core';
import { Calendario } from '../../../teacher/components/calendario/calendario';
import { Materia } from '../../../services/materia';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';
import { ComunicazioneCard } from '../../../teacher/components/comunicazione-card/comunicazione-card';
import { SyllexPagination } from '../../../teacher/components/syllex-pagination/syllex-pagination';

@Component({
  selector: 'app-student-comunicazioni',
  imports: [Calendario, ComunicazioneCard, SyllexPagination],
  templateUrl: './student-comunicazioni.html',
  styleUrl: './student-comunicazioni.scss',
})
export class StudentComunicazioni {
  private readonly materiaService = inject(Materia);
  private readonly comunicazioniService = inject(ComunicazioniService);

  readonly Subjects = this.materiaService.allMaterie;
  // Always has a value: seeded from the active materia, then kept in sync
  readonly SelectedSubject = signal(
    this.materiaService.materiaSelected()?._id ?? '',
  );

  readonly Comunicazioni = signal<ComunicazioneInterface[]>([]);
  readonly Page = signal(1);
  readonly PageSize = signal(10);
  readonly CollectionSize = signal(0);

  constructor() {
    // When materiaSelected resolves (async HTTP) and SelectedSubject is still empty, pick it up
    effect(() => {
      const materia = this.materiaService.materiaSelected();
      if (materia && !this.SelectedSubject()) {
        this.SelectedSubject.set(materia._id);
      }
    });

    // Reload comunicazioni whenever selected subject or page changes
    effect(() => {
      const subjectId = this.SelectedSubject();
      const page = this.Page();
      if (subjectId) {
        this.loadComunicazioni(subjectId, page);
      }
    });
  }

  onSubjectChange(subjectId: string): void {
    this.SelectedSubject.set(subjectId);
    this.Page.set(1);
  }

  private loadComunicazioni(subjectId: string, page: number): void {
    this.comunicazioniService
      .getPagedComunicazioni('', '', '', page, this.PageSize(), subjectId)
      .subscribe({
        next: (res) => {
          this.Comunicazioni.set(res.communications);
          this.CollectionSize.set(res.total);
        },
        error: (err) => console.error('Errore caricamento comunicazioni:', err),
      });
  }
}
