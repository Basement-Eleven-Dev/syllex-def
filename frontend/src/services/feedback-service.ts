import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: boolean;
  classname: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private toastIdCounter = 0;
  readonly toasts = signal<Toast[]>([]);

  /**
   * Mostra un feedback toast a schermo
   * @param message - Il messaggio da visualizzare
   * @param type - true per successo, false per errore
   */
  showFeedback(message: string, type: boolean): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      message,
      type,
      classname: type ? 'toast-success' : 'toast-error',
    };

    this.toasts.update((toasts) => [...toasts, toast]);

    // Auto-rimuovi il toast dopo 5 secondi
    setTimeout(() => this.remove(toast.id), 5000);
  }

  remove(id: number): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }
}
