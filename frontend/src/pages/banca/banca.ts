import { Component, signal, computed, OnInit, effect } from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { Question } from '../../components/search-questions/search-questions';
import { QuestionCard } from '../../components/question-card/question-card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QuestionsService, QuestionInterface } from '../../services/questions';

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
export class Banca implements OnInit {
  PlusIcon = faPlus;

  // Signals per state management
  private rawQuestions = signal<QuestionInterface[]>([]);
  private expandedQuestionId = signal<string | null>(null);

  // Pagination signals
  page = signal(1);
  pageSize = signal(10);
  collectionSize = signal(0);

  // Filter signals
  private filters = signal({
    searchTerm: '',
    type: '',
    policy: '' as 'pubblica' | 'privata' | '',
    topicId: '',
  });

  // Computed per convertire QuestionInterface -> Question
  questions = computed<Question[]>(() => {
    return this.rawQuestions().map((q) => ({
      id: q._id,
      text: q.text,
      explanation: q.explanation,
      policy: q.policy as 'pubblica' | 'privata',
      type: 'scelta multipla' as const, // TODO: mappare correttamente il type dal BE
      topic: q.topicId,
      imageUrl: q.imageUrl,
    }));
  });

  constructor(private questionsService: QuestionsService) {
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

  ngOnInit(): void {
    // Il load iniziale è gestito dall'effect
  }

  private loadQuestions(
    searchTerm: string,
    type: string,
    topicId: string,
    policy: 'pubblica' | 'privata' | '',
    page: number,
    pageSize: number,
  ): void {
    this.questionsService
      .loadPagedQuestions(searchTerm, type, topicId, policy, page, pageSize)
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
    searchTerm: string;
    type: string;
    policy: 'pubblica' | 'privata' | '';
    topicId: string;
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

  onNewPageRequested(): void {
    // La gestione è automatica tramite il two-way binding di ngModel e l'effect
  }
}
