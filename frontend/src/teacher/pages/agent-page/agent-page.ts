import { Component, computed, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
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
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  subjectSidebarOpen = signal(true);
  userRole = signal<'teacher' | 'student' | 'admin' | null>(null);
  activeTab = signal<'subjects' | 'chat'>('subjects');

  // Flusso unico: chat diretta
  currentStep = signal<1 | 2>(2);
  interactionMode = signal<'chat' | 'voice'>('chat');

  // Loading state per evitare flash UI
  isLoadingAssistant = computed(() => {
    return (
      this.materiaService.allMaterie().length === 0 &&
      !this.materiaService.materiaSelected()
    );
  });

  currentAssistantId = computed(() => {
    const subject = this.materiaService.materiaSelected();
    return subject?._id ? `alex-default-${subject._id}` : null;
  });

  constructor(
    public materiaService: Materia,
    private authService: Auth,
  ) {
    this.userRole.set(this.authService.user?.role || null);
    if (this.userRole() === 'student') {
      this.activeTab.set('chat');
    }

    // Quando viene selezionata o caricata una materia, mostra direttamente la chat dell'agente
    effect(
      () => {
        const subject = this.materiaService.materiaSelected();
        if (subject) {
          this.activeTab.set('chat');
        }
      },
      { allowSignalWrites: true },
    );
  }

  private resetState() {
    this.currentStep.set(2);
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
