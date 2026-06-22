import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';
import { Calendario } from '../../components/calendario/calendario';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexButton } from '../../components/UI/syllex-button/syllex-button';
import {
  ComunicazioneInterface,
  ComunicazioniService,
} from '../../../services/comunicazioni-service';
import { Materia } from '../../../services/materia';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendarAlt,
  faBullhorn,
  faPlus,
} from '@fortawesome/pro-solid-svg-icons';
import { SyllexEmptyState } from '../../components/UI/syllex-empty-state/syllex-empty-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateEditComunicazione } from '../create-edit-comunicazione/create-edit-comunicazione';
import { AddEventModal } from '../../components/add-event-modal/add-event-modal';

@Component({
  selector: 'app-events',
  imports: [
    RouterModule,
    Calendario,
    SyllexPageHeader,
    SyllexButton,
    DatePipe,
    FontAwesomeModule,
    TitleCasePipe,
    SyllexEmptyState,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class Events {
  @ViewChild(Calendario) calendarioComponent!: Calendario;

  faCalendarAlt = faCalendarAlt;
  faBullhorn = faBullhorn;
  faPlus = faPlus;
  protected readonly MessageIcon = faBullhorn;
  protected readonly PlusIcon = faPlus;

  private readonly comunicazioniService = inject(ComunicazioniService);
  private readonly modalService = inject(NgbModal);
  protected readonly translocoService = inject(TranslocoService);

  protected readonly materiaService = inject(Materia);

  private RawComunicazioni = signal<ComunicazioneInterface[]>([]);

  Comunicazioni = computed(() =>
    [...this.RawComunicazioni()].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }),
  );

  loadComunicazioni() {
    const materia = this.materiaService.materiaSelected();
    if (materia) {
      this.comunicazioniService
        .getPagedComunicazioni('', '', '', 1, 50)
        .subscribe((res) => this.RawComunicazioni.set(res.communications));
    }
  }

  openComunicazioneModal(comunicazioneId?: string) {
    const modalRef = this.modalService.open(CreateEditComunicazione, {
      centered: true,
      size: 'lg',
    });
    if (comunicazioneId) {
      modalRef.componentInstance.comunicazioneId = comunicazioneId;
    }
    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.loadComunicazioni();
          if (this.calendarioComponent) {
            this.calendarioComponent.refresh();
          }
        }
      },
      () => {},
    );
  }

  openAddEventModal(): void {
    const modalRef = this.modalService.open(AddEventModal, {
      centered: true,
    });
    modalRef.componentInstance.SelectedDate = new Date();
    modalRef.componentInstance.SubjectId = this.materiaService.materiaSelected()?._id;

    modalRef.result.then(
      (created) => {
        if (created) {
          if (this.calendarioComponent) {
            this.calendarioComponent.refresh();
          }
        }
      },
      () => {},
    );
  }

  constructor() {
    effect(() => {
      this.loadComunicazioni();
    });
  }

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

  onDragEnd() {
    this.isDragging = false;
  }
}
