import { DatePipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  ViewChild,
  computed,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowDownBigSmall,
  faBarsSort,
  faCalendar,
  faCheck,
  faChevronDown,
  faSignOutAlt,
  faUserCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { Auth, User } from '../../../services/auth';
import { Materia, MateriaObject } from '../../../services/materia';
import { Calendario } from '../calendario/calendario';
import { UserContextualMenu } from '../user-contextual-menu/user-contextual-menu';
import { SubjectSettingsModal } from '../subject-settings-modal/subject-settings-modal';
import { map, Observable } from 'rxjs';
import { HelpChat } from '../help-chat/help-chat';
import { SyllexButton } from '../UI/syllex-button/syllex-button';

@Component({
  selector: 'app-nav',
  imports: [
    DatePipe,
    TitleCasePipe,
    RouterModule,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    UserContextualMenu,
    TourAnchorNgBootstrapDirective,
    HelpChat,
    SyllexButton,
  ],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  LogoutIcon = faSignOutAlt;
  CalendarIcon = faCalendar;
  ChevronDownIcon = faChevronDown;
  CheckIcon = faCheck;
  now: number = Date.now();
  UserProfileIcon = faUserCircle;
  BarsSortIcon = faBarsSort;
  ArrowDownIcon = faArrowDownBigSmall;
  user: Observable<User | null>;
  @ViewChild(HelpChat) helpChatRef!: HelpChat;

  allSubjects = computed(() => this.materiaService.allMaterie());
  selectedSubject = computed(() => this.materiaService.materiaSelected());

  selectSubject(subject: MateriaObject): void {
    this.materiaService.setSelectedSubject(subject);
  }

  onRequestSubjectSettings(): void {
    this.modalService.open(SubjectSettingsModal, { centered: true });
  }

  toggleHelpChat() {
    this.helpChatRef?.toggleChat();
  }

  constructor(
    public authService: Auth,
    public materiaService: Materia,
    private modalService: NgbModal,
    private router: Router,
  ) {
    this.user = this.authService.user$;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeDropdown();
      }
    });
  }

  getInitals() {
    return this.authService.user$.pipe(
      map((user) => {
        if (!user || !user.firstName || !user.lastName) {
          return '';
        }
        return user.firstName.charAt(0) + user.lastName.charAt(0);
      }),
    );
  }

  onLogout() {
    this.authService.logout().then(() => {
      window.location.reload();
    });
  }

  openCalendarioModal() {
    const modalRef = this.modalService.open(Calendario, {
      size: 'xl',
      centered: true,
    });
    modalRef.componentInstance.showCloseButton = true;
  }

  @ViewChild(NgbDropdown) profileDropdown!: NgbDropdown;

  closeDropdown() {
    if (this.profileDropdown) {
      this.profileDropdown.close();
    }
  }
}
