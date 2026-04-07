import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBooks,
  faCheckDouble,
  faInfo,
  faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import { GenAiContents } from '../../components/gen-ai-contents/gen-ai-contents';
import { TourAnchorNgBootstrapDirective } from 'ngx-ui-tour-ng-bootstrap';

@Component({
  selector: 'app-laboratorio-ai',
  imports: [FontAwesomeModule, GenAiContents, TourAnchorNgBootstrapDirective],
  templateUrl: './laboratorio-ai.html',
  styleUrl: './laboratorio-ai.scss',
})
export class LaboratorioAi {
  QuestionsIcon = faCheckDouble;
  MaterialsIcon = faBooks;
  SparklesIcon = faSparkles;
  InfoCircleIcon = faInfo;

  isQuestionsHovered = signal(false);
  isMaterialsHovered = signal(false);

  selectedCreationType?: 'questions' | 'materials';

  ngOnInit() {
    this.selectedCreationType = 'materials';
  }
}
