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

  generateResponse(query: string, conversationId: string, inputType: 'text' | 'voice' = 'text') {
    return this.http.post<{
      success: boolean;
      aiResponse: any;
      _id: string;
      audioUrl?: string | null;
    }>('assistant/response', { query, inputType, conversationId });
  }

  getConversationHistory(conversationId: string) {
    return this.http.get<any[]>(
      'messages', { params: { conversationId } }
    );
  }

  listConversations() {
    return this.http.get<any[]>('messages/list-conversations');
  }

  deleteConversation(conversationId: string) {
    return this.http.delete<{ success: boolean; deletedCount?: number }>(
      'messages/' + conversationId
    );
  }

  saveLiveMessage(role: string, content: string, conversationId: string, inputType: string = 'voice') {
    return this.http.post<{ success: boolean; _id: string }>(
      'messages/save',
      { role, content, conversationId, inputType }
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
