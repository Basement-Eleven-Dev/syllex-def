import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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
export class QuestionsSearchFilters implements OnInit {
  @Output() filtersChanged = new EventEmitter<{
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }>();

  constructor(public materiaService: Materia) {}

  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
    type: new FormControl(''),
    policy: new FormControl(''),
    topicId: new FormControl(''),
  });

  ngOnInit(): void {
    // Emetti i filtri ogni volta che il form cambia
    this.searchForm.valueChanges.subscribe(() => {
      this.emitFilters();
    });

    // Emetti i filtri iniziali
    this.emitFilters();
  }

  private emitFilters(): void {
    const filters: any = {};

    const searchTerm = this.searchForm.get('searchTerm')?.value;
    const type = this.searchForm.get('type')?.value;
    const policy = this.searchForm.get('policy')?.value;
    const topicId = this.searchForm.get('topicId')?.value;

    if (searchTerm) filters.searchTerm = searchTerm;
    if (type) filters.type = type;
    if (policy) filters.policy = policy;
    if (topicId) filters.topicId = topicId;

    this.filtersChanged.emit(filters);
  }
}
