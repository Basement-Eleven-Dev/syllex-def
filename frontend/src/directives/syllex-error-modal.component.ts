import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-syllex-error-modal',
  standalone: true,
  imports: [FontAwesomeModule],
  template: `
    <div class="syllex-modal-container p-4 text-center">
      <!-- Close button -->
      <button type="button" class="btn-close-custom" aria-label="Chiudi" (click)="activeModal.dismiss()">
        <fa-icon [icon]="XIcon"></fa-icon>
      </button>

      <!-- Premium Warning Icon -->
      <div class="icon-wrapper mb-4 mx-auto">
        <div class="pulse-ring"></div>
        <div class="pulse-ring-outer"></div>
        <div class="icon-circle">
          <fa-icon [icon]="WarningIcon"></fa-icon>
        </div>
      </div>

      <!-- Content -->
      <h4 class="modal-title fw-bold mb-3">{{ title }}</h4>
      <p class="modal-message text-muted mb-4">{{ message }}</p>

      <!-- Dismiss Button -->
      <button type="button" class="btn btn-premium w-100 py-3 rounded-pill fw-semibold" (click)="activeModal.close('dismiss')">
        {{ buttonText }}
      </button>
    </div>
  `,
  styles: [`
    .syllex-modal-container {
      position: relative;
      background: #ffffff;
      border-radius: 24px;
      font-family: inherit;
    }

    .btn-close-custom {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.1rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-close-custom:hover {
      color: #64748b;
    }

    .icon-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-circle {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff9c3a 0%, #ff5252 100%);
      color: #ffffff;
      font-size: 1.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 20px rgba(255, 82, 82, 0.3);
      z-index: 2;
    }

    .pulse-ring {
      position: absolute;
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: rgba(255, 156, 58, 0.2);
      animation: pulse 2s infinite ease-in-out;
      z-index: 1;
    }
    .pulse-ring-outer {
      position: absolute;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(255, 82, 82, 0.08);
      animation: pulse-outer 2s infinite ease-in-out;
      z-index: 0;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.6; }
      100% { transform: scale(0.9); opacity: 1; }
    }

    @keyframes pulse-outer {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.4; }
      100% { transform: scale(0.9); opacity: 1; }
    }

    .modal-title {
      color: #1e293b;
      font-size: 1.35rem;
      letter-spacing: -0.01em;
    }

    .modal-message {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.6;
      white-space: pre-wrap;
      max-width: 420px;
      margin: 0 auto;
    }

    .btn-premium {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    }
    .btn-premium:active {
      transform: translateY(0);
    }
  `]
})
export class SyllexErrorModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  @Input() title = 'Attenzione';
  @Input() message = '';
  @Input() buttonText = 'Ho capito';

  readonly WarningIcon = faTriangleExclamation;
  readonly XIcon = faXmark;
}
