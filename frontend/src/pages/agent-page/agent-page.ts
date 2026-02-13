import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Materia } from '../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeadSideBrain } from '@fortawesome/pro-regular-svg-icons';
import { AgentSettingsForm } from '../../components/agent-settings-form/agent-settings-form';
import { AgentChat } from '../../components/agent-chat/agent-chat';

@Component({
  selector: 'app-agent-page',
  imports: [FormsModule, FontAwesomeModule, AgentChat, AgentSettingsForm],
  templateUrl: './agent-page.html',
  styleUrl: './agent-page.scss',
})
export class AgentPage {
  HeadSideBrainIcon = faHeadSideBrain;
  constructor(public materiaService: Materia) {}
}
