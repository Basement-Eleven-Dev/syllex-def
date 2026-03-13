import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

interface Agent {
  name: string;
  tone: string;
  voice: string;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(private http: HttpClient) { }

  getAssistant() {
    return this.http.post<{
      success: boolean;
      exists: boolean;
      assistant: any;
    }>('assistant', {});
  }

  createAgent(agent: Agent) {
    return this.http.post<{ success: boolean; assistantId: string }>(
      'assistant',
      { agent },
    );
  }

  updateAgent(assistantId: string, agent: any) {
    return this.http.put<{ success: boolean }>(
      'assistant', // Note: Need to verify if this route exists or create it
      { assistantId, agent },
    );
  }

  generateResponse(assistantId: string, query: string) {
    return this.http.post<{
      success: boolean;
      aiResponse: any;
      _id: string;
      audioUrl?: string | null;
    }>('assistant/response', { assistantId, query });
  }

  getConversationHistory() {
    return this.http.post<{ success: boolean; conversationHistory: any[] }>(
      'messages/history',
      {},
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
      'assistant/remove-material',
      { assistantId, materialId },
    );
  }
}
