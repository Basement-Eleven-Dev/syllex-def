import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Eventi di telemetria client accettati dal backend (POST /telemetry).
 * Devono restare allineati alla whitelist in
 * backend/src/functions/telemetry/recordTelemetry.ts.
 */
export type TelemetryAction =
  | 'material.open'
  | 'material.download'
  | 'voice.session'
  | 'navigation';

export interface TelemetryEvent {
  action: TelemetryAction;
  startedAt?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
  materialId?: string;
  conversationId?: string;
  model?: string;
  modality?: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Raccoglie la telemetria che vive solo nel browser (apertura materiali,
 * sessione vocale Gemini Live, navigazione) e la invia al backend in batch.
 *
 * Best-effort per costruzione: bufferizza, fa flush a intervalli o quando la
 * pagina viene nascosta/chiusa, e ignora gli errori. Non deve MAI disturbare
 * l'esperienza utente.
 */
@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private http = inject(HttpClient);

  private buffer: TelemetryEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly FLUSH_DELAY_MS = 5000;
  private readonly MAX_BUFFER = 20;

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush quando l'utente lascia o nasconde la pagina.
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush();
      });
      window.addEventListener('pagehide', () => this.flush());
    }
  }

  /** Accoda un evento di telemetria. Lo startedAt di default è "adesso". */
  track(event: TelemetryEvent): void {
    this.buffer.push({ startedAt: new Date().toISOString(), ...event });

    if (this.buffer.length >= this.MAX_BUFFER) {
      this.flush();
      return;
    }
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_DELAY_MS);
    }
  }

  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.buffer.length === 0) return;

    const events = this.buffer;
    this.buffer = [];

    // L'auth-interceptor aggiunge token + Subject-Id automaticamente.
    // Errori ignorati: la telemetria è best-effort.
    this.http.post('telemetry', { events }).subscribe({
      error: () => {
        /* swallow */
      },
    });
  }
}
