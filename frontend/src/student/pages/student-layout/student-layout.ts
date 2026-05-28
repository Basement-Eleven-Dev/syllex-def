import { Component, signal, ViewChild, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUserCircle,
  faQuestionCircle,
  faHouse,
  faCalendar,
  faFile,
  faFileLines,
  faRobot,
  faXmark,
  faRightFromBracket,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { StudentSidebar } from '../../components/student-sidebar/student-sidebar';
import { StudentNav } from '../../components/student-nav/student-nav';
import { StudentUserContextualMenu } from '../../components/student-user-contextual-menu/student-user-contextual-menu';
import { HelpChat } from '../../../teacher/components/help-chat/help-chat';
import { Auth, User } from '../../../services/auth';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    StudentSidebar,
    StudentNav,
    StudentUserContextualMenu,
    HelpChat,
  ],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.scss',
})
export class StudentLayout implements OnInit {
  @ViewChild('sidebarRef') sidebarRef!: StudentSidebar;
  @ViewChild(HelpChat) helpChatRef!: HelpChat;

  private readonly auth = inject(Auth);

  User = signal<User | null>(null);
  sidebarOpen = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);
  navHidden = signal<boolean>(false);
  private lastScrollY = 0;

  UserProfileIcon = faUserCircle;
  HelpIcon = faQuestionCircle;
  HouseIcon = faHouse;
  CalendarIcon = faCalendar;
  FileIcon = faFile;
  TestIcon = faFileLines;
  RobotIcon = faRobot;
  XmarkIcon = faXmark;
  LogoutIcon = faRightFromBracket;

  mainRoutes = [
    {
      path: 'dashboard',
      label: 'Home',
      icon: faHouse,
    },
    {
      path: 'comunicazioni',
      label: 'Comunicazioni',
      icon: faCalendar,
    },
    {
      path: 'risorse',
      label: 'Risorse',
      icon: faFile,
    },
    {
      path: 'tests',
      label: 'I miei test',
      icon: faFileLines,
    },
  ];

  ngOnInit(): void {
    this.auth.user$.subscribe((user) => this.User.set(user));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.auth.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentY = window.scrollY;
    const diff = currentY - this.lastScrollY;
    if (Math.abs(diff) < 5) return;
    this.navHidden.set(diff > 0 && currentY > 60);
    this.lastScrollY = currentY;
  }

  onContentScroll(event: Event) {
    const el = event.target as HTMLElement;
    const currentY = el.scrollTop;
    const diff = currentY - this.lastScrollY;
    if (Math.abs(diff) < 5) return;
    this.navHidden.set(diff > 0 && currentY > 60);
    this.lastScrollY = currentY;
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  openHelpChat() {
    this.helpChatRef?.toggleChat();
  }
}
