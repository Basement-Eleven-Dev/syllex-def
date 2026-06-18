import { Component, computed, inject, signal } from '@angular/core';
import { AgentChat } from '../../../teacher/components/agent-chat/agent-chat';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective } from '@jsverse/transloco';
import { faRobot } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-agent',
  imports: [AgentChat, FontAwesomeModule, TranslocoDirective],
  templateUrl: './agent.html',
  styleUrl: './agent.scss',
})
export class Agent {
  private materiaService = inject(Materia);

  readonly Subjects = this.materiaService.allMaterie;
  readonly SelectedSubjectId = signal('');

  readonly AssistantId = computed(() => {
    const id = this.SelectedSubjectId();
    return id ? `alex-default-${id}` : null;
  });

  readonly RobotIcon = faRobot;

  onSubjectChange(subjectId: string): void {
    this.SelectedSubjectId.set(subjectId);
  }
}
