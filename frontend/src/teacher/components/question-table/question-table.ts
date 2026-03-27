import { Component, inject, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencilAlt, faTrash, faUser } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuestionInterface } from '../../../services/questions';
import { Materia } from '../../../services/materia';
import { QuestionCard } from '../question-card/question-card';
import { QuestionPreviewModal } from './question-preview-modal';
import { ConfirmActionDirective } from '../../../directives/confirm-action.directive';

@Component({
  selector: 'app-question-table',
  standalone: true,
  imports: [
    TitleCasePipe,
    FontAwesomeModule,
    RouterModule,
    ConfirmActionDirective,
  ],
  templateUrl: './question-table.html',
  styleUrl: './question-table.scss',
})
export class QuestionTable {
  protected readonly EditIcon = faPencilAlt;
  protected readonly TrashIcon = faTrash;
  protected readonly UserIcon = faUser;

  protected readonly materiaService = inject(Materia);
  private readonly modalService = inject(NgbModal);

  readonly questions = input.required<QuestionInterface[]>();
  readonly removeMe = output<string>();

  onOpenPreview(question: QuestionInterface): void {
    const modalRef = this.modalService.open(QuestionPreviewModal, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.question = question;
  }
}
