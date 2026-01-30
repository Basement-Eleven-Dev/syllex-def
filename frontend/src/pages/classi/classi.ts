import { Component } from '@angular/core';
import { Materia } from '../../services/materia';
import { AsyncPipe, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faEye,
  faGrid,
  faList,
  faUser,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { ClassiService } from '../../services/classi-service';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-classi',
  imports: [
    AsyncPipe,
    NgClass,
    FontAwesomeModule,
    RouterModule,
    NgbPagination,
    FormsModule,
  ],
  templateUrl: './classi.html',
  styleUrl: './classi.scss',
})
export class Classi {
  ListIcon = faList;
  GridIcon = faGrid;
  UserIcon = faUser;
  UsersIcon = faUsers;
  EyeIcon = faEye;
  CalendarIcon = faCalendar;

  viewType: 'grid' | 'table' = 'grid';
  constructor(
    public materiaService: Materia,
    public classiService: ClassiService,
  ) {}
  onChangeViewType(view: 'grid' | 'table'): void {
    this.viewType = view;
  }

  page: number = 1;
  pageSize: number = 10;
  collectionSize: number = 50;
  onNewPageRequested(): void {
    // Logica per caricare una nuova pagina di classi
  }
}
