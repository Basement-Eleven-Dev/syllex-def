import { Component, effect } from '@angular/core';
import { Auth } from '../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faBuilding, faMarker } from '@fortawesome/pro-solid-svg-icons';
import { AsyncPipe } from '@angular/common';
import { Materia } from '../../services/materia';
import { ClasseInterface, ClassiService } from '../../services/classi-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditEmail } from '../../app/edit-email/edit-email';
import { EditPassword } from '../../app/edit-password/edit-password';

@Component({
  selector: 'app-profile',
  imports: [FontAwesomeModule, AsyncPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  BuildingIcon = faBuilding;
  EditIcon = faMarker;
  BookIcon = faBook;
  constructor(
    public authService: Auth,
    public materiaService: Materia,
    private classiService: ClassiService,
    private modalService: NgbModal,
  ) {
    effect(() => {
      const assegnazioni = this.classiService.allAssegnazioni();
      if (assegnazioni) {
        (console.log(assegnazioni),
          (this.assegnazioni = assegnazioni.map((a) => ({
            class: a.class,
            subjectId: a.subjectId,
          }))));
      }
    });
  }

  assegnazioni: {
    class: ClasseInterface;
    subjectId: string;
  }[] = [];
  ngOnInit(): void {}

  countClasses(subjectId: string): number {
    return this.assegnazioni.filter(
      (assegnazione) => assegnazione.subjectId === subjectId,
    ).length;
  }

  onChangeEmail(): void {
    this.modalService.open(EditEmail, {
      centered: true,
      size: 'md',
    });
  }

  onChangePassword(): void {
    this.modalService.open(EditPassword, {
      centered: true,
      size: 'md',
    });
  }
}
