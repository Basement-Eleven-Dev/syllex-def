import { Component, effect, inject } from '@angular/core';
import { Auth } from '../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faBuilding, faMarker } from '@fortawesome/pro-solid-svg-icons';
import { AsyncPipe } from '@angular/common';
import { Materia } from '../../../services/materia';
import {
  ClassInterface,
  ClassiService,
} from '../../../services/classi-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditEmail } from '../../../app/edit-email/edit-email';
import { EditPassword } from '../../../app/edit-password/edit-password';

@Component({
  selector: 'app-profile',
  imports: [FontAwesomeModule, AsyncPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  // Dependency Injection
  public authService = inject(Auth);
  public materiaService = inject(Materia);
  private classiService = inject(ClassiService);
  private modalService = inject(NgbModal);

  // Public Properties
  public BuildingIcon = faBuilding;
  public EditIcon = faMarker;
  public BookIcon = faBook;
  public Assegnazioni: {
    class: ClassInterface;
    subjectId: string;
  }[] = [];

  constructor() {
    effect(() => {
      const assegnazioni = this.classiService.AllAssignments();
      if (assegnazioni) {
        console.log(assegnazioni);
        this.Assegnazioni = assegnazioni.map(
          (a: { class: ClassInterface; subjectId: string }) => ({
            class: a.class,
            subjectId: a.subjectId,
          }),
        );
      }
    });
  }

  // Lifecycle Hooks
  ngOnInit(): void {}

  // Public Methods
  countClasses(subjectId: string): number {
    return this.Assegnazioni.filter(
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
