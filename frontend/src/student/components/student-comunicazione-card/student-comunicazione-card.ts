import { Component, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faArrowRight } from '@fortawesome/pro-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ComunicazioneInterface } from '../../../services/comunicazioni-service';
import { StudentComunicazioneDetailModal } from '../student-comunicazione-detail-modal/student-comunicazione-detail-modal';

@Component({
  selector: 'div[app-student-comunicazione-card]',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule],
  templateUrl: './student-comunicazione-card.html',
  styleUrl: './student-comunicazione-card.scss',
})
export class StudentComunicazioneCard implements OnInit {
  @Input() comunicazione!: ComunicazioneInterface;

  readonly ClockIcon = faClock;
  readonly ArrowIcon = faArrowRight;

  readonly localIsRead = signal(false);

  constructor(private modalService: NgbModal) {}

  ngOnInit(): void {
    this.localIsRead.set(this.comunicazione?.isRead ?? false);
  }

  isNew(): boolean {
    return !this.localIsRead();
  }

  openModal(): void {
    if (!this.comunicazione?._id) return;
    const modalRef = this.modalService.open(StudentComunicazioneDetailModal, {
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.comunicazioneId = this.comunicazione._id;
    modalRef.result.then(
      () => this.localIsRead.set(true),
      () => this.localIsRead.set(true),
    );
  }
}
