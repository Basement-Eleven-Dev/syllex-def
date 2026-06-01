import { Component, inject, ViewChild, computed, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { DatePipe, TitleCasePipe, CommonModule, AsyncPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUserCircle,
  faChevronDown,
} from '@fortawesome/pro-solid-svg-icons';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import { Auth } from '../../../services/auth';
import { StudentUserContextualMenu } from '../student-user-contextual-menu/student-user-contextual-menu';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Materia } from '../../../services/materia';
import { SelectOption, SyllexSelectInput } from '../../../teacher/components/UI/syllex-select-input/syllex-select-input';

@Component({
  selector: 'app-student-nav',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
    TitleCasePipe,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    StudentUserContextualMenu,
    SyllexSelectInput,
  ],
  templateUrl: './student-nav.html',
  styleUrl: './student-nav.scss',
})
export class StudentNav implements OnInit {
  authService = inject(Auth);
  private router = inject(Router);
  materiaService = inject(Materia);

  UserProfileIcon = faUserCircle;
  ChevronDownIcon = faChevronDown;
  now: number = Date.now();

  isAgentRoute = signal(false);

  @Output() openChat = new EventEmitter<void>();

  subjectOptions = computed<SelectOption[]>(() => {
    return this.materiaService.allMaterie().map((m) => ({
      value: m._id,
      label: m.name,
    }));
  });

  ngOnInit(): void {
    this.isAgentRoute.set(this.router.url.includes('/s/agente'));
    this.router.events.subscribe(() => {
      this.isAgentRoute.set(this.router.url.includes('/s/agente'));
    });
  }

  onSubjectChange(subjectId: string) {
    const subject = this.materiaService.allMaterie().find((m) => m._id === subjectId);
    if (subject) {
      this.materiaService.setSelectedSubject(subject);
    }
  }

  getInitals(): Observable<string> {
    return this.authService.user$.pipe(
      map((user) => {
        if (!user || !user.firstName || !user.lastName) {
          return '';
        }
        return user.firstName.charAt(0) + user.lastName.charAt(0);
      })
    );
  }

  toggleHelpChat() {
    this.openChat.emit();
  }
}
