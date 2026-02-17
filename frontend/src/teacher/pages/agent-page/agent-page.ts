import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeadSideBrain } from '@fortawesome/pro-regular-svg-icons';
import { AgentChat } from '../../components/agent-chat/agent-chat';
import { AgentSettingsForm } from '../../components/agent-settings-form/agent-settings-form';
import { Auth } from '../../../services/auth';
import { AgentService } from '../../../services/agent.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-page',
  standalone: true,
  imports: [
    FormsModule,
    FontAwesomeModule,
    AgentChat,
    AgentSettingsForm,
    CommonModule,
  ],
  templateUrl: './agent-page.html',
  styleUrl: './agent-page.scss',
})
export class AgentPage {
  HeadSideBrainIcon = faHeadSideBrain;
  currentAssistantId = signal<string | null>(null);
  userRole = signal<'teacher' | 'student' | 'admin' | null>(null);

  constructor(
    public materiaService: Materia,
    private authService: Auth,
    private agentService: AgentService,
  ) {
    this.userRole.set(this.authService.user?.role || null);

    // Caricamento dell'assistente reattivo al cambio materia (utile soprattutto per studenti)
    effect(() => {
      const subject = this.materiaService.materiaSelected();
      if (subject?._id) {
        this.loadAssistant();
      } else {
        this.currentAssistantId.set(null);
      }
    });
  }

  private loadAssistant() {
    this.agentService.getAssistant().subscribe({
      next: (res) => {
        if (res.exists && res.assistant) {
          const id = res.assistant._id?.$oid || res.assistant._id;
          this.currentAssistantId.set(id);
        } else {
          this.currentAssistantId.set(null);
        }
      },
      error: (err) => {
        console.error('Error loading assistant for student:', err);
        this.currentAssistantId.set(null);
      },
    });
  }

  onAssistantLoaded(id: string | null) {
    this.currentAssistantId.set(id);
  }

  selectMateria(materia: any) {
    this.currentAssistantId.set(null); // Forza lo svuotamento della UI
    this.materiaService.setSelectedSubject(materia);
  }
}
