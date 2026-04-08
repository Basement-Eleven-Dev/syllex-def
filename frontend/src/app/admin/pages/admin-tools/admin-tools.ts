import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { DeterministicPasswordTool } from '../../components/dashboard-super-admin/deterministic-password-tool';
import { BulkEmailTool } from '../../components/dashboard-super-admin/bulk-email-tool';

@Component({
  selector: 'app-admin-tools',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    DeterministicPasswordTool, 
    BulkEmailTool
  ],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex align-items-center gap-3 mb-5">
        <div class="icon-box-lg bg-primary bg-opacity-10 text-primary">
          <fa-icon [icon]="faSparkles"></fa-icon>
        </div>
        <div>
          <h1 class="fw-bold h3 mb-1">Strumenti Superadmin</h1>
          <p class="text-muted small mb-0">Gestione avanzata e utility di sistema</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Password Recovery Tool -->
        <div class="col-12 col-xl-6">
          <app-deterministic-password-tool></app-deterministic-password-tool>
        </div>

        <!-- Bulk Email Tool -->
        <div class="col-12 col-xl-6">
          <app-bulk-email-tool></app-bulk-email-tool>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .icon-box-lg {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      font-size: 24px;
    }
  `]
})
export class AdminTools {
  faSparkles = faSparkles;
}
