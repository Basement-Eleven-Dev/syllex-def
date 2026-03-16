import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPrint, faTimes, faFilePdf } from '@fortawesome/pro-solid-svg-icons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-print-modal',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule],
  templateUrl: './test-print-modal.html',
  styleUrl: './test-print-modal.scss'
})
export class TestPrintModal {
  @Input() test: any;
  @Input() questions: any[] = [];
  
  activeModal = inject(NgbActiveModal);
  
  instructions: string = '';
  
  PrintIcon = faPrint;
  PdfIcon = faFilePdf;
  CloseIcon = faTimes;
  
  onPrint() {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const questionsHtml = this.questions.map((q, i) => {
      let answersHtml = '';
      
      if (q.type === 'vero falso') {
        answersHtml = `
          <div class="options">
            <label><span class="checkbox"></span> Vero</label>
            <label><span class="checkbox"></span> Falso</label>
          </div>`;
      } else if (q.type === 'scelta multipla' && q.options?.length) {
        const opts = q.options.map((opt: any) => `
          <label><span class="checkbox"></span> ${opt.label}</label>
        `).join('');
        answersHtml = `<div class="options column">${opts}</div>`;
      } else if (q.type === 'risposta aperta') {
        answersHtml = `<div class="answer-lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>`;
      }

      return `
        <div class="question">
          <div class="question-text"><span class="question-num">${i + 1}.</span> ${q.text}</div>
          ${answersHtml}
        </div>`;
    }).join('');

    const instructionsHtml = this.instructions
      ? `<div class="instructions"><h4>Istruzioni:</h4><p>${this.instructions.replace(/\n/g, '<br>')}</p></div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.test.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 0;
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    .page {
      width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
    }
    
    .header .meta {
      text-align: right;
      font-size: 10pt;
    }
    
    .header .meta p { margin-bottom: 4px; }
    
    .student-info {
      display: flex;
      gap: 40px;
      border: 1px solid #ccc;
      padding: 10px 14px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 11pt;
    }
    
    .instructions {
      border-left: 3px solid #555;
      padding: 8px 12px;
      margin-bottom: 20px;
      background: #f9f9f9;
      font-size: 10pt;
    }
    
    .instructions h4 {
      font-size: 10pt;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .question {
      margin-bottom: 28px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .question-text {
      margin-bottom: 10px;
      line-height: 1.5;
    }
    
    .question-num {
      font-weight: bold;
      margin-right: 4px;
    }
    
    .options {
      display: flex;
      gap: 24px;
      margin-left: 16px;
      flex-wrap: wrap;
    }
    
    .options.column {
      flex-direction: column;
      gap: 8px;
    }
    
    .options label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11pt;
      cursor: default;
    }
    
    .checkbox {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid #000;
      border-radius: 2px;
      flex-shrink: 0;
    }
    
    .answer-lines {
      margin-left: 16px;
      margin-top: 8px;
    }
    
    .line {
      border-bottom: 1px solid #bbb;
      height: 28px;
      width: 100%;
      margin-bottom: 2px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #888;
    }
    
    @media print {
      body { padding: 0; margin: 0; }
      .page { padding: 0; margin: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <h1>${this.test.name}</h1>
        <p style="font-size: 10pt; color: #555; margin-top: 4px;">Test di valutazione</p>
      </div>
      <div class="meta">
        <p><strong>Data:</strong> ________________________</p>
        <p><strong>Classe:</strong> ______________</p>
      </div>
    </div>
    
    <div class="student-info">
      <div><strong>Nome:</strong> ____________________________________</div>
      <div><strong>Cognome:</strong> _________________________________</div>
    </div>
    
    ${instructionsHtml}
    
    <div class="questions-list">
      ${questionsHtml}
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
