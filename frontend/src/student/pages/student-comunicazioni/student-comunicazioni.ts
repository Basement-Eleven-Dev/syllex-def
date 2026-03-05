import { Component, effect, inject, signal } from '@angular/core';
import { Calendario } from '../../../teacher/components/calendario/calendario';
import { Materia } from '../../../services/materia';

import { ComunicazioniService } from '../../../services/comunicazioni-service';

@Component({
  selector: 'app-student-comunicazioni',
  imports: [Calendario],
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

  constructor() {}

  onSubjectChange(subjectId: string): void {
    this.SelectedSubject.set(subjectId);
  }
}
