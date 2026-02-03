import { Component } from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { mockQuestions } from '../../mock_questions';
import { Question } from '../../components/search-questions/search-questions';
import { QuestionCard } from '../../components/question-card/question-card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

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

  questions: Question[] = mockQuestions;
  expandedQuestionId: string | null = null; // Track della card espansa

  onFiltersChanged(filters: { searchTerm: string; type: string }): void {
    // Logica per gestire i cambiamenti dei filtri
  }

  onQuestionExpanded(questionId: string): void {
    // Se questionId è vuoto, chiudi tutte. Se è l'ID già espanso, chiudi tutte
    if (questionId === '' || this.expandedQuestionId === questionId) {
      this.expandedQuestionId = null;
    } else {
      this.expandedQuestionId = questionId;
    }
  }

  isQuestionCollapsed(questionId: string): boolean {
    return this.expandedQuestionId !== questionId;
  }

  page = 1;
  pageSize = 10;
  collectionSize = 10;
  onNewPageRequested() {
    throw new Error('Method not implemented.');
  }
}
