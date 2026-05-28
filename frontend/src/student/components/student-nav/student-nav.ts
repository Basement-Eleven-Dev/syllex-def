import { Component, inject, ViewChild } from '@angular/core';
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
  ],
  templateUrl: './student-nav.html',
  styleUrl: './student-nav.scss',
})
export class StudentNav {
  authService = inject(Auth);

  UserProfileIcon = faUserCircle;
  ChevronDownIcon = faChevronDown;
  now: number = Date.now();

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
}
