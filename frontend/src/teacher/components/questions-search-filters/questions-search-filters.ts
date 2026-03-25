import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import {
  DIFFICULTY_OPTIONS,
  QuestionDifficulty,
} from '../../../types/question.types';

@Component({
  selector: 'app-questions-search-filters',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TitleCasePipe, FontAwesomeModule],
  templateUrl: './questions-search-filters.html',
  styleUrl: './questions-search-filters.scss',
})
export class QuestionsSearchFilters implements OnInit {
  @Output() filtersChanged = new EventEmitter<{
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
    difficulty?: QuestionDifficulty;
    aiGenerated?: boolean;
  }>();

  // Icons
  protected readonly ClearIcon = faXmark;

  // Data
  protected readonly DifficultyOptions = DIFFICULTY_OPTIONS;

  // Dependency Injection
  protected readonly materiaService = inject(Materia);

  protected SearchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
    type: new FormControl(''),
    policy: new FormControl(''),
    topicId: new FormControl(''),
    difficulty: new FormControl(''),
    aiGenerated: new FormControl(''),
  });

  ngOnInit(): void {
    this.SearchForm.valueChanges.subscribe(() => {
      this.emitFilters();
    });

    this.emitFilters();
  }

  resetFilters(): void {
    this.SearchForm.reset({
      searchTerm: '',
      type: '',
      policy: '',
      topicId: '',
      difficulty: '',
      aiGenerated: '',
    });
  }

  private emitFilters(): void {
    const filters: any = {};

    const searchTerm = this.SearchForm.get('searchTerm')?.value;
    const type = this.SearchForm.get('type')?.value;
    const policy = this.SearchForm.get('policy')?.value;
    const topicId = this.SearchForm.get('topicId')?.value;
    const difficulty = this.SearchForm.get('difficulty')?.value;
    const aiGeneratedRaw = this.SearchForm.get('aiGenerated')?.value;

    if (searchTerm) filters.searchTerm = searchTerm;
    if (type) filters.type = type;
    if (policy) filters.policy = policy;
    if (topicId) filters.topicId = topicId;
    if (difficulty) filters.difficulty = difficulty;
    if (
      aiGeneratedRaw !== '' &&
      aiGeneratedRaw !== null &&
      aiGeneratedRaw !== undefined
    ) {
      filters.aiGenerated =
        aiGeneratedRaw === true || aiGeneratedRaw === 'true';
    }

    console.log('Emettendo filtri:', filters);
    this.filtersChanged.emit(filters);
  }
}
