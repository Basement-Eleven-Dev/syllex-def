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
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-questions-search-filters',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    SyllexSearchInput,
    SyllexSelectInput,
    TranslocoDirective,
    TranslocoPipe,
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

  // Dependency Injection
  protected readonly materiaService = inject(Materia);
  private readonly translocoService = inject(TranslocoService);

  // Data
  get DifficultyOptions() {
    return DIFFICULTY_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.translocoService.translate(`banca.filters.difficulty.${opt.value}`)
    }));
  }

  get typeOptions() {
    return [
      { value: 'scelta multipla', label: this.translocoService.translate('banca.tabs.scelta_multipla') },
      { value: 'vero falso', label: this.translocoService.translate('banca.tabs.vero_falso') },
      { value: 'risposta aperta', label: this.translocoService.translate('banca.tabs.aperta') },
    ];
  }

  protected readonly topicOptions = computed(() =>
    (this.materiaService.materiaSelected()?.topics ?? []).map((t) => ({
      value: t._id ?? '',
      label: t.name,
    })),
  );

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
