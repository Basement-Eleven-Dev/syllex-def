import { Component, computed, effect, inject, signal } from '@angular/core';
import { Calendario } from '../../../teacher/components/calendario/calendario';
import { Materia } from '../../../services/materia';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelopeOpenText, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { StudentComunicazioneCard } from '../../components/student-comunicazione-card/student-comunicazione-card';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';

@Component({
  selector: 'app-student-comunicazioni',
  imports: [Calendario, DatePipe, TitleCasePipe, FontAwesomeModule, StudentComunicazioneCard],
  templateUrl: './student-comunicazioni.html',
  styleUrl: './student-comunicazioni.scss',
})
export class StudentComunicazioni {
  private readonly materiaService = inject(Materia);
  private readonly comunicazioniService = inject(ComunicazioniService);

  readonly EnvelopeIcon = faEnvelopeOpenText;
  readonly ArrowRightIcon = faChevronRight;

  readonly Subjects = this.materiaService.allMaterie;
  readonly SelectedSubject = signal('');

  RawComunicazioni = signal<ComunicazioneInterface[]>([]);

  Comunicazioni = computed(() => {
    const filter = this.SelectedSubject();
    const list = [...this.RawComunicazioni()];
    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    return filter ? list.filter((c) => c.subjectId === filter) : list;
  });

  constructor() {
    effect(() => {
      this.loadComunicazioni();
    });
  }

  loadComunicazioni() {
    this.comunicazioniService
      .getPagedComunicazioni('', '', '', 1, 50)
      .subscribe((res) => {
        this.RawComunicazioni.set(res.communications || []);
      });
  }

  onSubjectChange(subjectId: string): void {
    this.SelectedSubject.set(subjectId);
  }

  // --- Scroll and Drag Carousel Logic ---
  private isDragging = false;
  private dragStartX = 0;
  private dragScrollLeft = 0;

  onComScroll(event: WheelEvent) {
    const el = event.currentTarget as HTMLElement;
    el.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  onDragStart(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    this.isDragging = true;
    this.dragStartX = event.pageX - el.offsetLeft;
    this.dragScrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }

  onDragMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    const el = event.currentTarget as HTMLElement;
    const x = event.pageX - el.offsetLeft;
    const walk = (x - this.dragStartX) * 1.5;
    el.scrollLeft = this.dragScrollLeft - walk;
  }

  onDragEnd(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    this.isDragging = false;
    el.style.cursor = 'grab';
  }
}
