import { Component, effect, inject, signal } from '@angular/core';
import { Auth } from '../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faBuilding, faMarker, faShieldHalved } from '@fortawesome/pro-solid-svg-icons';
import { AsyncPipe } from '@angular/common';
import { Materia } from '../../../services/materia';
import {
  ClassInterface,
  ClassiService,
} from '../../../services/classi-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditEmail } from '../../../app/edit-email/edit-email';
import { EditPassword } from '../../../app/edit-password/edit-password';
import { SetupMfa } from '../../../app/setup-mfa/setup-mfa';

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
  public ShieldIcon = faShieldHalved;
  public mfaEnabled = signal<boolean | null>(null);
  public Assegnazioni: {
    class: ClassInterface;
    subjectId: string;
  }[] = [];

  constructor() {
    // Load MFA preference
    this.authService.getMfaPreference().then((enabled) => {
      this.mfaEnabled.set(enabled);
    });

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
  getMaterie() {
    // Se è uno studente, usa solo le materie assegnate allo studente
    if (this.authService.user?.role === 'student') {
      return this.materiaService.allMaterie();
    }
    // Se è un docente, mostra tutte le materie
    return this.materiaService.allMaterie();
  }

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

  async onSetup2FA(): Promise<void> {
    const modalRef = this.modalService.open(SetupMfa, {
      centered: true,
      size: 'md',
    });
    const result = await modalRef.result.catch(() => 'dismissed');
    if (result === 'enabled') {
      this.mfaEnabled.set(true);
    }
  }

  async onDisable2FA(): Promise<void> {
    const result = await this.authService.disableMfa();
    if (result.success) {
      this.mfaEnabled.set(false);
    }
  }
}
