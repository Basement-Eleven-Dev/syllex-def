import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeadSideBrain, faGear } from '@fortawesome/pro-solid-svg-icons';
import { AgentChat } from '../../components/agent-chat/agent-chat';
import { AgentSettingsForm } from '../../components/agent-settings-form/agent-settings-form';
import { Auth } from '../../../services/auth';
import { AgentService } from '../../../services/agent.service';
import { CommonModule } from '@angular/common';
import { FeedbackService } from '../../../services/feedback-service';

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
  faGear = faGear;
  currentAssistantId = signal<string | null>(null);
  userRole = signal<'teacher' | 'student' | 'admin' | null>(null);
  activeTab = signal<'subjects' | 'chat'>('subjects');

  // Gestione Step: 1 = Configurazione, 2 = Chat
  currentStep = signal<1 | 2>(1);
  interactionMode = signal<'chat' | 'voice'>('chat'); 

  constructor(
    public materiaService: Materia,
    private authService: Auth,
    private agentService: AgentService,
    private feedbackService: FeedbackService,
    private route: ActivatedRoute,
  ) {
    this.userRole.set(this.authService.user?.role || null);

    // Gestione parametro query per forzare lo step
    this.route.queryParams.subscribe(params => {
      if (params['step'] === '1') {
        this.currentStep.set(1);
      }
    });

    // Caricamento dell'assistente reattivo al cambio materia
    effect(() => {
      const subject = this.materiaService.materiaSelected();
      if (subject?._id) {
        this.loadAssistant();
      } else {
        this.resetState();
      }
    });
  }

  private loadAssistant() {
    this.agentService.getAssistant().subscribe({
      next: (res) => {
        if (res.exists && res.assistant) {
          const id = res.assistant._id?.$oid || res.assistant._id;
          this.currentAssistantId.set(id);
          
          // Solo lo studente viene proiettato direttamente in chat
          // Il docente deve poter vedere/modificare la configurazione (Step 1)
          if (this.userRole() === 'student') {
            this.currentStep.set(2);
          } else {
            // Per il docente, rimaniamo allo step 1 (configuratore)
            this.currentStep.set(1);
          }
        } else {
          this.currentAssistantId.set(null);
          this.currentStep.set(1);
        }
      },
      error: (err) => {
        console.error('Error loading assistant:', err);
        this.currentAssistantId.set(null);
        this.currentStep.set(1);
      }
    });
  }

  private resetState() {
    this.currentAssistantId.set(null);
    this.currentStep.set(1);
  }

  onAssistantSaved(id: string | null) {
    if (id) {
      this.currentAssistantId.set(id);
      this.currentStep.set(2);
    }
  }

  onBackToConfig() {
    this.currentStep.set(1);
  }

  selectMateria(materia: any) {
    this.materiaService.setSelectedSubject(materia);
    this.activeTab.set('chat');
  }
}
