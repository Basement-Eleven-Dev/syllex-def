import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

interface Agent {
  name: string;
  tone: string;
  voice: string;
  subjectId: string;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(private http: HttpClient) {}

  getAssistant(subjectId: string) {
    return this.http.post<{
      success: boolean;
      exists: boolean;
      assistant: any;
    }>('assistants/get', { subjectId });
  }

  createAgent(agent: Agent) {
    return this.http.post<{ success: boolean; assistantId: string }>(
      'assistants/create',
      { agent },
    );
  }

  updateAgent(assistantId: string, agent: any) {
    return this.http.post<{ success: boolean }>(
      'assistants/update', // Note: Need to verify if this route exists or create it
      { assistantId, agent },
    );
  }

  generateResponse(assistantId: string, query: string, subjectId: string) {
    return this.http.post<{
      success: boolean;
      aiResponse: any;
      _id: string;
      audioUrl?: string | null;
    }>('assistants/response', { assistantId, query, subjectId });
  }

  getConversationHistory(subjectId: string) {
    return this.http.post<{ success: boolean; conversationHistory: any[] }>(
      'messages/history',
      { subjectId },
    );
  }

  listenToMessage(messageId: string, text: string, assistantId: string) {
    return this.http.post<{ success: boolean; audioUrl: string }>(
      'messages/listen',
      { messageId, text, assistantId },
    );
  }

  removeMaterial(assistantId: string, materialId: string) {
    return this.http.post<{ success: boolean; message: string }>(
      'assistants/remove-material',
      { assistantId, materialId },
    );
  }
}
