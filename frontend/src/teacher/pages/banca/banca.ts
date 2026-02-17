import {
  Component,
  signal,
  computed,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { QuestionCard } from '../../components/question-card/question-card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { SyllexPagination } from '../../components/syllex-pagination/syllex-pagination';
import { FormsModule } from '@angular/forms';
import {
  QuestionsService,
  QuestionInterface,
} from '../../../services/questions';
import { Materia } from '../../../services/materia';

@Component({
  selector: 'app-banca',
  imports: [
    QuestionsSearchFilters,
    QuestionCard,
    FontAwesomeModule,
    RouterModule,
    SyllexPagination,
    FormsModule,
  ],
  templateUrl: './banca.html',
  styleUrl: './banca.scss',
})
export class Banca {
  // Icons
  protected readonly PlusIcon = faPlus;

  // Dependency Injection
  private readonly questionsService = inject(QuestionsService);
  protected readonly materiaService = inject(Materia);

  // Signals
  private RawQuestions = signal<QuestionInterface[]>([]);
  private ExpandedQuestionId = signal<string | null>(null);
  Page = signal(1);
  PageSize = signal(10);
  CollectionSize = signal(0);

  private Filters = signal<{
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }>({});

  Questions = computed<QuestionInterface[]>(() => {
    return this.RawQuestions();
  });

  constructor() {
    console.log('Banca constructor: component initialized');
    // Effetto: carica domande quando cambia la materia selezionata
    effect(() => {
      const materia = this.materiaService.materiaSelected();
      if (materia) {
        // Reset pagina a 1 quando cambia materia
        this.Page.set(1);
        this.loadQuestionsWithCurrentFilters();
      }
    });

    // Effetto: carica domande quando cambiano filtri o paginazione
    effect(() => {
      const materia = this.materiaService.materiaSelected();
      const currentFilters = this.Filters();
      const currentPage = this.Page();
      const currentPageSize = this.PageSize();
      if (materia) {
        this.loadQuestions(
          currentFilters.searchTerm,
          currentFilters.type,
          currentFilters.topicId,
          currentFilters.policy,
          currentPage,
          currentPageSize,
        );
      }
    });
  }

  private loadQuestionsWithCurrentFilters() {
    const currentFilters = this.Filters();
    const currentPage = this.Page();
    const currentPageSize = this.PageSize();
    this.loadQuestions(
      currentFilters.searchTerm,
      currentFilters.type,
      currentFilters.topicId,
      currentFilters.policy,
      currentPage,
      currentPageSize,
    );
  }

  onFiltersChanged(filters: {
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }): void {
    this.Filters.set(filters);
    this.Page.set(1);
  }

  onQuestionExpanded(questionId: string): void {
    const currentExpanded = this.ExpandedQuestionId();
    if (questionId === '' || currentExpanded === questionId) {
      this.ExpandedQuestionId.set(null);
    } else {
      this.ExpandedQuestionId.set(questionId);
    }
  }

  isQuestionCollapsed(questionId: string): boolean {
    return this.ExpandedQuestionId() !== questionId;
  }

  private loadQuestions(
    searchTerm?: string,
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta',
    topicId?: string,
    policy?: 'public' | 'private',
    page?: number,
    pageSize?: number,
  ): void {
    const subjectId = this.materiaService.materiaSelected()?._id;
    console.log('Caricamento domande con i seguenti parametri:', {
      searchTerm,
      type,
      topicId,
      policy,
      page,
      pageSize,
      subjectId,
    });
    this.questionsService
      .loadPagedQuestions(
        searchTerm,
        type,
        topicId,
        policy,
        page || 1,
        pageSize || 10,
        subjectId,
      )
      .subscribe({
        next: (response) => {
          console.log('Domande caricate con successo:', response);
          this.RawQuestions.set(response.questions);
          this.CollectionSize.set(response.total);
        },
        error: (err) => {
          console.error('Errore nel caricamento delle domande:', err);
        },
      });
  }
}
