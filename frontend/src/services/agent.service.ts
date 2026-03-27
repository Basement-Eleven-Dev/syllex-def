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
    return this.http.get<{
      success: boolean;
      exists: boolean;
      assistant: any;
    }>('assistant');
  }

  createAgent(agent: Agent) {
    return this.http.post<{ success: boolean; assistantId: string }>(
      'assistant',
      { agent },
    );
  }

  updateAgent(agent: any) {
    return this.http.put<{ success: boolean }>(
      'assistant', // Note: Need to verify if this route exists or create it
      agent,
    );
  }

  generateResponse(query: string) {
    return this.http.post<{
      success: boolean;
      aiResponse: any;
      _id: string;
      audioUrl?: string | null;
    }>('assistant/response', { query });
  }

  getConversationHistory() {
    return this.http.get<any[]>(
      'messages'
    );
  }

  listenToMessage(messageId: string, text: string) {
    return this.http.post<{ success: boolean; audioUrl: string }>(
      'messages/' + messageId + '/generate-audio',
      { text },
    );
  }

  removeMaterial(materialId: string) {
    return this.http.delete<{ success: boolean; message: string }>(
      'assistant/materials/' + materialId
    );
  }
}
