import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAlignLeft,
  faChartDiagram,
  faList,
  faPresentationScreen,
  IconDefinition,
} from '@fortawesome/pro-solid-svg-icons';

interface MaterialType {
  name: string;
  description: string;
  icon: IconDefinition;
}

@Component({
  selector: 'app-gen-ai-materials',
  imports: [FontAwesomeModule],
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

  onSelectType(type: MaterialType) {
    this.selectedType = type;
  }
}
