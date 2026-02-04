import { Component } from '@angular/core';
import { Materia } from '../../services/materia';
import { AsyncPipe, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faEye,
  faUser,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { ClassiService } from '../../services/classi-service';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';

@Component({
  selector: 'app-classi',
  imports: [
    AsyncPipe,
    NgClass,
    FontAwesomeModule,
    RouterModule,
    NgbPagination,
    FormsModule,
    ViewTypeToggle,
  ],
  templateUrl: './classi.html',
  styleUrl: './classi.scss',
})
export class Classi {
  UserIcon = faUser;
  UsersIcon = faUsers;
  EyeIcon = faEye;
  CalendarIcon = faCalendar;

  viewType: ViewType = 'grid';
  constructor(
    public materiaService: Materia,
    public classiService: ClassiService,
  ) {}
  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }

  page: number = 1;
  pageSize: number = 10;
  collectionSize: number = 50;
  onNewPageRequested(): void {
    // Logica per caricare una nuova pagina di classi
  }
}
