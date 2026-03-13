import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPrint, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-test-results-print-modal',
  standalone: true,
  imports: [FontAwesomeModule, DatePipe],
  templateUrl: './test-results-print-modal.html',
  styleUrl: './test-results-print-modal.scss',
})
export class TestResultsPrintModal {
  @Input() testName = '';
  @Input() attempts: any[] = [];
  @Input() maxScore: number = 0;

  activeModal = inject(NgbActiveModal);

  PrintIcon = faPrint;
  CloseIcon = faTimes;

  readonly today = new Date();

  get delivered(): any[] {
    return this.attempts.filter(
      (a) => a.status === 'delivered' || a.status === 'reviewed',
    );
  }

  get reviewed(): any[] {
    return this.attempts.filter((a) => a.status === 'reviewed');
  }

  get notDelivered(): any[] {
    return this.attempts.filter(
      (a) => a.status !== 'delivered' && a.status !== 'reviewed',
    );
  }

  get averageScore(): string {
    const scored = this.attempts.filter((a) => a.score != null);
    if (!scored.length) return '-';
    const avg =
      scored.reduce((sum: number, a: any) => sum + a.score, 0) / scored.length;
    return avg.toFixed(1);
  }

  get maxObtainedScore(): string {
    const scored = this.attempts.filter((a) => a.score != null);
    if (!scored.length) return '-';
    return Math.max(...scored.map((a: any) => a.score)).toString();
  }

  get minObtainedScore(): string {
    const scored = this.attempts.filter((a) => a.score != null);
    if (!scored.length) return '-';
    return Math.min(...scored.map((a: any) => a.score)).toString();
  }

  getStatusLabel(attempt: any): string {
    if (attempt.status === 'reviewed') return 'Corretto';
    if (attempt.status === 'delivered') return 'Da correggere';
    return 'Non consegnato';
  }

  getStatusClass(attempt: any): string {
    if (attempt.status === 'reviewed') return 'text-success';
    if (attempt.status === 'delivered') return 'text-warning';
    return 'text-danger';
  }

  onPrint(): void {
    const today = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const rowsHtml = this.attempts
      .map((a, i) => {
        const name = `${a.studentLastName ?? ''} ${a.studentName ?? ''}`.trim();
        const delivered =
          a.status === 'delivered' || a.status === 'reviewed' ? 'Sì' : 'No';
        const corrected = a.status === 'reviewed' ? 'Sì' : 'No';
        const score =
          a.score != null ? `${a.score} / ${a.maxScore ?? this.maxScore}` : '-';

        return `<tr>
          <td>${i + 1}</td>
          <td>${name}</td>
          <td>${delivered}</td>
          <td>${corrected}</td>
          <td>${score}</td>
        </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Risultati - ${this.testName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
    }
    @page { size: A4; margin: 20mm 15mm; }
    .page { width: 210mm; margin: 0 auto; padding: 20mm 15mm; }

    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 18pt; margin-bottom: 4px; }
    .header .subtitle { font-size: 10pt; color: #555; }
    .header .date { font-size: 10pt; text-align: right; }

    .summary {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; text-align: center;
      margin-bottom: 24px; padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .summary-item { font-size: 10pt; }
    .summary-item strong { display: block; font-size: 13pt; }

    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    thead th {
      text-align: left; padding: 8px 6px;
      border-bottom: 2px solid #333;
      font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px;
    }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #eee; }
    tbody tr:nth-child(even) { background: #f9f9f9; }

    .footer {
      margin-top: 40px; padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center; font-size: 8pt; color: #888;
    }

    @media print {
      body { padding: 0; margin: 0; }
      .page { padding: 0; margin: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header" style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1>${this.testName}</h1>
        <p class="subtitle">Riepilogo risultati</p>
      </div>
      <div class="date"><strong>Stampato il</strong> ${today}</div>
    </div>

    <div class="summary">
      <div class="summary-item"><strong>${this.attempts.length}</strong> Assegnati</div>
      <div class="summary-item"><strong>${this.delivered.length}</strong> Consegnati</div>
      <div class="summary-item"><strong>${this.reviewed.length}</strong> Corretti</div>
      <div class="summary-item"><strong>${this.averageScore}</strong> Media voto</div>
      <div class="summary-item"><strong>${this.maxObtainedScore}</strong> Voto max</div>
      <div class="summary-item"><strong>${this.minObtainedScore}</strong> Voto min</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Studente</th>
          <th>Consegnato</th>
          <th>Corretto</th>
          <th>Punteggio</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="footer">Documento generato automaticamente</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
