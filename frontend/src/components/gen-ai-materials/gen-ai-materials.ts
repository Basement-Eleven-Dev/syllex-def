import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAlignLeft,
  faChartDiagram,
  faList,
  faPresentationScreen,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';
import { TopicsService } from '../../services/topics-service';
import { Materia } from '../../services/materia';
import { MaterialiSelector } from '../materiali-selector/materiali-selector';

interface MaterialType {
  name: string;
  description: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-gen-ai-materials',
  imports: [FontAwesomeModule, MaterialiSelector],
  templateUrl: './gen-ai-materials.html',
  styleUrl: './gen-ai-materials.scss',
})
export class GenAiMaterials {
  types: MaterialType[] = [
    {
      name: 'Slides',
      description: 'Presentazioni per lezioni o conferenze',
      icon: faPresentationScreen,
    },
    {
      name: 'Riassunto',
      description: 'Note dettagliate per lo studio',
      icon: faAlignLeft,
    },
    {
      name: 'Glossario',
      description: 'Rappresentazioni schematiche di concetti',
      icon: faList,
    },
    {
      name: 'Mappe Concettuali',
      description: 'Mappe per visualizzare relazioni tra concetti',
      icon: faChartDiagram,
    },
  ];

  selectedType?: MaterialType;

  constructor(
    public topicService: TopicsService,
    public materiaService: Materia,
  ) {}

  onSelectType(type: MaterialType) {
    this.selectedType = type;
  }

  topicsSelected: string[] = [];
  onToggleTopic(topic: string) {
    const index = this.topicsSelected.indexOf(topic);
    if (index > -1) {
      this.topicsSelected.splice(index, 1);
    } else {
      this.topicsSelected.push(topic);
    }
  }

  isTopicSelected(topic: string): boolean {
    return this.topicsSelected.includes(topic);
  }
}
