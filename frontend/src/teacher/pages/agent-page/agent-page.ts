import { Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';
import { AgentChat } from '../../components/agent-chat/agent-chat';
import { Auth } from '../../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-page',
  standalone: true,
  imports: [FormsModule, FontAwesomeModule, AgentChat, CommonModule],
  templateUrl: './agent-page.html',
  styleUrl: './agent-page.scss',
})
export class AgentPage {
  faArrowLeft = faArrowLeft;
  currentAssistantId = signal<string | null>(null);
  userRole = signal<'teacher' | 'student' | 'admin' | null>(null);
  activeTab = signal<'subjects' | 'chat'>('subjects');

  // Flusso unico: chat diretta
  currentStep = signal<1 | 2>(2);
  interactionMode = signal<'chat' | 'voice'>('chat');

  // Loading state per evitare flash UI
  isLoadingAssistant = signal<boolean>(true);

  constructor(
    public materiaService: Materia,
    private authService: Auth,
  ) {
    this.userRole.set(this.authService.user?.role || null);

    // Flusso diretto: assistant virtuale legato alla materia selezionata
    effect(() => {
      const subject = this.materiaService.materiaSelected();
      if (subject?._id) {
        this.currentAssistantId.set(`alex-default-${subject._id}`);
        this.isLoadingAssistant.set(false);
      } else {
        this.resetState();
      }
    });
  }

  private resetState() {
    this.currentAssistantId.set(null);
    this.currentStep.set(2);
    this.isLoadingAssistant.set(false);
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
