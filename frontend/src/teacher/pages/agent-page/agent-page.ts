import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeadSideBrain,
  faGear,
  faArrowLeft,
} from '@fortawesome/pro-solid-svg-icons';
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
  faArrowLeft = faArrowLeft;
  currentAssistantId = signal<string | null>(null);
  userRole = signal<'teacher' | 'student' | 'admin' | null>(null);
  activeTab = signal<'subjects' | 'chat'>('subjects');

  // Gestione Step: 1 = Configurazione, 2 = Chat
  currentStep = signal<1 | 2>(2);
  interactionMode = signal<'chat' | 'voice'>('chat');

  // Studente: assistente non ancora disponibile per questa materia
  noAssistantAvailable = signal<boolean>(false);

  // Loading state per evitare flash del configuratore
  isLoadingAssistant = signal<boolean>(true);

  constructor(
    public materiaService: Materia,
    private authService: Auth,
    private agentService: AgentService,
    private feedbackService: FeedbackService,
    private route: ActivatedRoute,
  ) {
    this.userRole.set(this.authService.user?.role || null);

    // Gestione parametro query per forzare lo step (solo teacher)
    this.route.queryParams.subscribe((params) => {
      if (params['step'] === '1' && this.userRole() !== 'student') {
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
    this.noAssistantAvailable.set(false);
    this.isLoadingAssistant.set(true);

    this.agentService.getAssistant().subscribe({
      next: (res) => {
        if (res.exists && res.assistant) {
          const id = res.assistant._id?.$oid || res.assistant._id;
          this.currentAssistantId.set(id);

          const isStudent = this.userRole() === 'student';

          if (isStudent) {
            // Lo studente va sempre dritto alla chat
            this.currentStep.set(2);
          } else {
            // Teacher/Admin: mostra configuratore solo la prima volta
            const subjectId = this.materiaService.materiaSelected()?._id;
            const userId = this.authService.user?._id;
            const key = `agent_configured_${userId}_${subjectId}`;

            if (localStorage.getItem(key)) {
              this.currentStep.set(2);
            } else {
              this.currentStep.set(1);
            }
          }
        } else {
          this.currentAssistantId.set(null);

          if (this.userRole() === 'student') {
            // Studente: il docente non ha ancora configurato l'agente
            this.noAssistantAvailable.set(true);
            this.currentStep.set(2);
          } else {
            this.currentStep.set(1);
          }
        }
        this.isLoadingAssistant.set(false);
      },
      error: (err) => {
        console.error('Error loading assistant:', err);
        this.currentAssistantId.set(null);
        if (this.userRole() !== 'student') {
          this.currentStep.set(1);
        }
        this.isLoadingAssistant.set(false);
      },
    });
  }

  private resetState() {
    this.currentAssistantId.set(null);
    this.noAssistantAvailable.set(false);
    if (this.userRole() !== 'student') {
      this.currentStep.set(1);
    }
  }

  onAssistantSaved(id: string | null) {
    if (id) {
      this.currentAssistantId.set(id);
      this.currentStep.set(2);

      // Segna come configurato — non mostrerà più il configuratore automaticamente
      const subjectId = this.materiaService.materiaSelected()?._id;
      const userId = this.authService.user?._id;
      if (subjectId && userId) {
        localStorage.setItem(`agent_configured_${userId}_${subjectId}`, '1');
      }
    }
  }

  onBackToConfig() {
    this.currentStep.set(1);
  }

  // Studente: torna alla lista materie
  showSubjectsList() {
    this.activeTab.set('subjects');
  }

  selectMateria(materia: any) {
    this.materiaService.setSelectedSubject(materia);
    this.activeTab.set('chat');
  }
}
