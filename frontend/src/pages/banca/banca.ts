import { Component } from '@angular/core';
import { QuestionsSearchFilters } from '../../components/questions-search-filters/questions-search-filters';
import { mockQuestions } from '../../mock_questions';
import { Question } from '../../components/questions-filters/questions-filters';
import { QuestionCard } from '../../components/question-card/question-card';

@Component({
  selector: 'app-banca',
  imports: [QuestionsSearchFilters, QuestionCard],
  templateUrl: './banca.html',
  styleUrl: './banca.scss',
})
export class Banca {
  questions: Question[] = mockQuestions;
  onFiltersChanged(filters: { searchTerm: string; type: string }): void {
    // Logica per gestire i cambiamenti dei filtri
  }
}
