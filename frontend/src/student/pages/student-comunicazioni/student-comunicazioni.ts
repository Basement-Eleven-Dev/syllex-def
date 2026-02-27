import { Component, effect, inject, signal } from '@angular/core';
import { Calendario } from '../../../teacher/components/calendario/calendario';
import { Materia } from '../../../services/materia';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';
import { StudentComunicazioneCard } from '../../components/student-comunicazione-card/student-comunicazione-card';
import { SyllexPagination } from '../../../teacher/components/syllex-pagination/syllex-pagination';

@Component({
  selector: 'app-student-comunicazioni',
  imports: [Calendario, StudentComunicazioneCard, SyllexPagination],
  templateUrl: './student-comunicazioni.html',
  styleUrl: './student-comunicazioni.scss',
})
export class StudentComunicazioni {
  private readonly materiaService = inject(Materia);
  private readonly comunicazioniService = inject(ComunicazioniService);

  readonly Subjects = this.materiaService.allMaterie;
  // Always has a value: seeded from the active materia, then kept in sync
  // Always has a value: seeded from the active materia, then kept in sync
  // Default to empty string for "All Subjects" if needed, or stick to current logic
  readonly SelectedSubject = signal('');

  readonly Comunicazioni = signal<ComunicazioneInterface[]>([]);
  readonly Page = signal(1);
  readonly PageSize = signal(10);
  readonly CollectionSize = signal(0);

  constructor() {
    // When materiaSelected resolves (async HTTP), use it as initial filter if SelectedSubject is still the default ""
    effect(() => {
      const materia = this.materiaService.materiaSelected();
      if (materia && !this.SelectedSubject()) {
        // We could keep it empty for "All Subjects" by default, but let's follow the user's need for a "general" view.
        // If we want "All Subjects" by default, we leave it empty.
      }
    });

    // Reload comunicazioni whenever selected subject or page changes
    effect(() => {
      const subjectId = this.SelectedSubject();
      const page = this.Page();
      this.loadComunicazioni(subjectId, page);
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
