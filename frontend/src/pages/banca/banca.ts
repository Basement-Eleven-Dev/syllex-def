import { Component, signal, computed, OnInit, effect } from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { QuestionCard } from '../../components/question-card/question-card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QuestionsService, QuestionInterface } from '../../services/questions';
import { Materia } from '../../services/materia';

@Component({
  selector: 'app-banca',
  imports: [
    QuestionsSearchFilters,
    QuestionCard,
    FontAwesomeModule,
    RouterModule,
    NgbPagination,
    FormsModule,
  ],
  templateUrl: './banca.html',
  styleUrl: './banca.scss',
})
export class Banca {
  PlusIcon = faPlus;

  // Signals per state management
  private rawQuestions = signal<QuestionInterface[]>([]);
  private expandedQuestionId = signal<string | null>(null);

  // Pagination signals
  page = signal(1);
  pageSize = signal(10);
  collectionSize = signal(0);

  // Filter signals
  private filters = signal<{
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }>({});

  questions = computed<QuestionInterface[]>(() => {
    return this.rawQuestions();
  });

  constructor(
    private questionsService: QuestionsService,
    public materiaService: Materia,
  ) {
    // Effect che triggera il load quando cambiano filtri o paginazione
    effect(() => {
      const currentFilters = this.filters();
      const currentPage = this.page();
      const currentPageSize = this.pageSize();

      this.loadQuestions(
        currentFilters.searchTerm,
        currentFilters.type,
        currentFilters.topicId,
        currentFilters.policy,
        currentPage,
        currentPageSize,
      );
    });
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
          this.rawQuestions.set(response.questions);
          this.collectionSize.set(response.total);
        },
        error: (err) => {
          console.error('Errore nel caricamento delle domande:', err);
        },
      });
  }

  onFiltersChanged(filters: {
    searchTerm?: string;
    type?: 'scelta multipla' | 'vero falso' | 'risposta aperta';
    policy?: 'public' | 'private';
    topicId?: string;
  }): void {
    this.filters.set(filters);
    this.page.set(1); // Reset pagina quando cambiano i filtri
  }

  onQuestionExpanded(questionId: string): void {
    const currentExpanded = this.expandedQuestionId();
    if (questionId === '' || currentExpanded === questionId) {
      this.expandedQuestionId.set(null);
    } else {
      this.expandedQuestionId.set(questionId);
    }
  }

  isQuestionCollapsed(questionId: string): boolean {
    return this.expandedQuestionId() !== questionId;
  }
}
