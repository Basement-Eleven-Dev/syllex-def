import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Materia } from '../../services/materia';

@Component({
  selector: 'app-questions-search-filters',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TitleCasePipe],
  templateUrl: './questions-search-filters.html',
  styleUrl: './questions-search-filters.scss',
})
export class QuestionsSearchFilters {
  @Output() filtersChanged = new EventEmitter<{
    searchTerm: string;
    type: string;
    policy: 'pubblica' | 'privata' | '';
    topicId: string;
  }>();

  constructor(public materiaService: Materia) {}

  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
    type: new FormControl(''),
    policy: new FormControl(''),
    topicId: new FormControl(''),
  });
}
