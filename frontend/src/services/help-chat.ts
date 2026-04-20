import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HelpChatAction {
  type: string;
  path: string;
  label: string;
}

export interface HelpChatResponse {
  success: boolean;
  data: {
    content: string;
    suggestedAction: HelpChatAction | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class HelpChat {
  private http = inject(HttpClient);

  askHelp(
    query: string,
    history: { role: string; content: string }[],
    currentPath?: string,
  ): Observable<HelpChatResponse> {
    return this.http.post<HelpChatResponse>('ai/help-chat', {
      query,
      history,
      currentPath,
    });
  }
}
