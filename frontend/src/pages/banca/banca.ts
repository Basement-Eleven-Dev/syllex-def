import { Component } from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { mockQuestions } from '../../mock_questions';
import { Question } from '../../components/questions-filters/questions-filters';
import { QuestionCard } from '../../components/question-card/question-card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-banca',
  imports: [
    QuestionsSearchFilters,
    QuestionCard,
    FontAwesomeModule,
    RouterModule,
  ],
  templateUrl: './banca.html',
  styleUrl: './banca.scss',
})
export class Banca {
  PlusIcon = faPlus;

  questions: Question[] = mockQuestions;
  onFiltersChanged(filters: { searchTerm: string; type: string }): void {
    // Logica per gestire i cambiamenti dei filtri
  }
}
