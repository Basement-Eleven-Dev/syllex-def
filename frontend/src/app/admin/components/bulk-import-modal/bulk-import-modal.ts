import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileImport, faUsers, faExclamationTriangle, faCheckCircle, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-bulk-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './bulk-import-modal.html',
  styleUrl: './bulk-import-modal.scss'
})
export class BulkImportModal {
  activeModal = inject(NgbActiveModal);
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);

  @Input() orgId!: string;
  @Input() classes: any[] = [];
  @Input() targetClassId?: string;

  importData: string = '';
  selectedClassId: string = '';
  parsedStudents: any[] = [];
  loading = false;
  error: string | null = null;
  showHelp = false;

  icons = {
    faFileImport,
    faUsers,
    faExclamationTriangle,
    faCheckCircle,
    faTimes
  };

  ngOnInit() {
    if (this.targetClassId) {
      this.selectedClassId = this.targetClassId;
    }
  }

  parseData() {
    this.error = null;
    if (!this.importData.trim()) {
        this.parsedStudents = [];
        return;
    }

    try {
      // Prova a parsare come JSON o come linee di testo separate da tab/comma
      if (this.importData.trim().startsWith('[')) {
        this.parsedStudents = JSON.parse(this.importData);
      } else {
        const lines = this.importData.split('\n').filter(l => l.trim());
        this.parsedStudents = lines.map(line => {
          const parts = line.split(/[,\t]/).map(p => p.trim());
          return {
            firstName: parts[0] || '',
            lastName: parts[1] || '',
            email: parts[2] || ''
          };
        }).filter(s => s.email && s.firstName);
      }

      if (this.parsedStudents.length === 0) {
        this.error = 'Nessun dato valido trovato. Formato atteso: Nome, Cognome, Email';
      }
    } catch (e) {
      this.error = 'Errore nel formato dei dati. Assicurati che sia un JSON valido o testo separato da virgole.';
      this.parsedStudents = [];
    }
  }

  onSubmit() {
    if (this.parsedStudents.length === 0 || !this.selectedClassId) return;

    this.loading = true;
    this.onboardingService.bulkImportStudents(this.orgId, this.selectedClassId, this.parsedStudents).subscribe({
      next: (res) => {
        this.loading = false;
        this.feedbackService.showFeedback(`Importazione completata: ${res.count} studenti`, true);
        this.activeModal.close(true);
      },
      error: () => {
        this.loading = false;
        this.feedbackService.showFeedback('Errore durante l\'importazione', false);
      }
    });
  }
}
