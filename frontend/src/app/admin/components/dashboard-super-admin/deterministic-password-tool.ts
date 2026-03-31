import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from '../../service/onboarding-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faKey, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-deterministic-password-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3 d-flex align-items-center">
          <fa-icon [icon]="icons.faKey" class="text-primary me-2"></fa-icon>
          Recupero Password Temporanea
        </h5>
        <p class="text-muted small mb-3">
          Inserisci l'email dell'utente per scoprire la sua password temporanea deterministica.
        </p>
        
        <div class="input-group mb-3">
          <input 
            type="email" 
            class="form-control" 
            placeholder="email@esempio.it" 
            [(ngModel)]="email"
            (keyup.enter)="generate()">
          <button 
            class="btn btn-primary" 
            type="button" 
            [disabled]="!email || loading()"
            (click)="generate()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
            }
            Genera
          </button>
        </div>

        @if (password()) {
          <div class="alert alert-info d-flex align-items-center justify-content-between mb-0 py-2">
            <div>
              <span class="small text-muted me-2">Password:</span>
              <strong class="font-monospace">{{ password() }}</strong>
            </div>
            <button class="btn btn-sm btn-link text-decoration-none" (click)="copyToClipboard()">
              <fa-icon [icon]="copied() ? icons.faCheck : icons.faCopy" [class.text-success]="copied()"></fa-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .font-monospace {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      letter-spacing: 0.5px;
    }
  `]
})
export class DeterministicPasswordTool {
  private onboardingService = inject(OnboardingService);

  email = '';
  password = signal<string | null>(null);
  loading = signal(false);
  copied = signal(false);

  icons = {
    faKey,
    faCopy,
    faCheck
  };

  generate() {
    if (!this.email) return;
    
    this.loading.set(true);
    this.password.set(null);
    this.copied.set(false);

    this.onboardingService.getDeterministicPassword(this.email.trim().toLowerCase()).subscribe({
      next: (res) => {
        this.password.set(res.password);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error generating password:', err);
        this.loading.set(false);
        alert('Errore durante la generazione della password. Verifica di essere superadmin.');
      }
    });
  }

  copyToClipboard() {
    const pwd = this.password();
    if (pwd) {
      navigator.clipboard.writeText(pwd);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
