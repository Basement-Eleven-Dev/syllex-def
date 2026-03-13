import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Auth } from '../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faBuilding, faMarker, faShieldHalved, faUser, faCog, faBell, faLock } from '@fortawesome/pro-solid-svg-icons';
import { AsyncPipe, NgClass } from '@angular/common';
import { Materia } from '../../../services/materia';
import {
  ClassInterface,
  ClassiService,
} from '../../../services/classi-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditEmail } from '../../../app/edit-email/edit-email';
import { EditPassword } from '../../../app/edit-password/edit-password';
import { SetupMfa } from '../../../app/setup-mfa/setup-mfa';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  imports: [FontAwesomeModule, AsyncPipe, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  // Dependency Injection
  public authService = inject(Auth);
  public materiaService = inject(Materia);
  private classiService = inject(ClassiService);
  private modalService = inject(NgbModal);

  // User Signal for reactivity
  private userSignal = toSignal(this.authService.user$);

  // Icons
  public BuildingIcon = faBuilding;
  public EditIcon = faMarker;
  public BookIcon = faBook;
  public ShieldIcon = faShieldHalved;
  public ProfileIcon = faUser;
  public SettingsIcon = faCog;
  public BellIcon = faBell;
  public SecurityIcon = faLock;

  // Tabs
  public activeTab = signal<'profile' | 'settings'>('profile');

  // Reactivity
  public settingsInitialized = computed(() => !!this.userSignal()?.notificationSettings);

  // MFA
  public mfaEnabled = signal<boolean | null>(null);

  // Notification Settings
  public notificationSettings = {
    newCommunication: signal(true),
    newEvent: signal(true),
    newTest: signal(true),
    testCorrected: signal(true)
  };
  public Assegnazioni: {
    class: ClassInterface;
    subjectId: string;
  }[] = [];

  constructor() {
    // Load MFA preference
    this.authService.getMfaPreference().then((enabled) => {
      this.mfaEnabled.set(enabled);
    });

    // Initialize notification settings when user profile is loaded
    effect(() => {
      const user = this.userSignal();
      const settings = user?.notificationSettings;
      
      if (settings) {
        untracked(() => {
          this.notificationSettings.newCommunication.set(!!settings.newCommunication);
          this.notificationSettings.newEvent.set(!!settings.newEvent);
          this.notificationSettings.newTest.set(!!settings.newTest);
          this.notificationSettings.testCorrected.set(!!settings.testCorrected);
        });
      }
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

  setTab(tab: 'profile' | 'settings'): void {
    this.activeTab.set(tab);
  }

  async saveNotificationSettings(): Promise<void> {
    const settings = {
      newCommunication: this.notificationSettings.newCommunication(),
      newEvent: this.notificationSettings.newEvent(),
      newTest: this.notificationSettings.newTest(),
      testCorrected: this.notificationSettings.testCorrected()
    };
    
    console.log('Salvataggio impostazioni notifiche (Teacher):', settings);
    const result = await this.authService.updateNotificationSettings(settings);
    if (!result.success) {
      console.error('Errore durante il salvataggio delle impostazioni:', result.message);
      // Opzionale: mostrare un toast o ripristinare il valore precedente
    }
  }
}
