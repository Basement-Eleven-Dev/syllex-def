import {
  Component,
  computed,
  EventEmitter,
  Output,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { SyllexSearchInput } from '../UI/syllex-search-input/syllex-search-input';
import { SyllexSelectInput } from '../UI/syllex-select-input/syllex-select-input';
import {
  DIFFICULTY_OPTIONS,
  QuestionDifficulty,
} from '../../../types/question.types';

@Component({
  selector: 'app-questions-search-filters',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SyllexSearchInput,
    SyllexSelectInput,
  ],
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
    tag?: string;
  }>();

  // Icons
  protected readonly ClearIcon = faXmark;

  // Data
  protected readonly DifficultyOptions = DIFFICULTY_OPTIONS;

  protected readonly typeOptions = [
    { value: 'scelta multipla', label: 'Scelta multipla' },
    { value: 'vero falso', label: 'Vero falso' },
    { value: 'risposta aperta', label: 'Risposta aperta' },
  ];

  protected readonly topicOptions = computed(() =>
    (this.materiaService.materiaSelected()?.topics ?? []).map((t) => ({
      value: t._id ?? '',
      label: t.name,
    })),
  );

  // Dependency Injection
  protected readonly materiaService = inject(Materia);

  protected SearchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl(''),
    type: new FormControl(''),
    policy: new FormControl(''),
    topicId: new FormControl(''),
    difficulty: new FormControl(''),
    aiGenerated: new FormControl(''),
    tag: new FormControl(''),
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
      tag: '',
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
    const tag = this.SearchForm.get('tag')?.value;

    if (searchTerm) filters.searchTerm = searchTerm;
    if (type) filters.type = type;
    if (policy) filters.policy = policy;
    if (topicId) filters.topicId = topicId;
    if (difficulty) filters.difficulty = difficulty;
    if (tag) filters.tag = tag;
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
