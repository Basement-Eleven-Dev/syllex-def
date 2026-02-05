import { Component, input, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { TopicsService } from '../../services/topics-service';
import { Materia } from '../../services/materia';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';
import { TypeSelector, TypeOption } from '../type-selector/type-selector';
import {
  QUESTION_TYPE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from '../../types/question.types';

@Component({
  selector: 'app-gen-ai-contents',
  imports: [FontAwesomeModule, MaterialiSelector, TypeSelector],
  templateUrl: './gen-ai-contents.html',
  styleUrl: './gen-ai-contents.scss',
})
export class GenAiContents {
  type = input<'questions' | 'materials'>('materials');
  SparklesIcon = faSparkles;

  types = signal<TypeOption[]>([]);
  selectedType = signal<string>('');
  topicsSelected = signal<string[]>([]);

  constructor(
    public topicService: TopicsService,
    public materiaService: Materia,
  ) {}

  ngOnInit() {
    if (this.type() === 'materials') {
      this.types.set(MATERIAL_TYPE_OPTIONS);
    } else {
      this.types.set(QUESTION_TYPE_OPTIONS);
    }
    this.selectedType.set(this.types()[0].value);
  }

  onToggleTopic(topic: string) {
    const currentTopics = this.topicsSelected();
    const index = currentTopics.indexOf(topic);
    if (index > -1) {
      this.topicsSelected.set(currentTopics.filter((t) => t !== topic));
    } else {
      this.topicsSelected.set([...currentTopics, topic]);
    }
  }

  isTopicSelected(topic: string): boolean {
    return this.topicsSelected().includes(topic);
  }

  getSelectedTypeName(): string {
    const selected = this.types().find((t) => t.value === this.selectedType());
    return selected?.label || '';
  }
}
