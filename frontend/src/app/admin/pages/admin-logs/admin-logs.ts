import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
} from '@ng-bootstrap/ng-bootstrap';
import {
  faClockRotateLeft,
  faRotateRight,
  faMagnifyingGlass,
  faTriangleExclamation,
  faRobot,
  faGlobe,
  faGears,
  faDisplay,
  faFileLines,
  faFileCsv,
  faFileCode,
  faFileExport,
  faChevronDown,
  faFilter,
  faCoins,
} from '@fortawesome/pro-solid-svg-icons';
import {
  LogsService,
  ActivityLog,
  LogsFilters,
  CostSummaryModel,
  ExportFormat,
} from '../../service/logs-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
  ],
  templateUrl: './admin-logs.html',
  styleUrl: './admin-logs.scss',
})
export class AdminLogs implements OnInit {
  private readonly logsService = inject(LogsService);
  private readonly feedbackService = inject(FeedbackService);

  readonly HistoryIcon = faClockRotateLeft;
  readonly RefreshIcon = faRotateRight;
  readonly SearchIcon = faMagnifyingGlass;
  readonly ErrorIcon = faTriangleExclamation;
  readonly ReportIcon = faFileLines;
  readonly CsvIcon = faFileCsv;
  readonly JsonIcon = faFileCode;
  readonly ExportIcon = faFileExport;
  readonly ChevronIcon = faChevronDown;
  readonly FilterIcon = faFilter;
  readonly CoinsIcon = faCoins;

  logs = signal<ActivityLog[]>([]);
  costModels = signal<CostSummaryModel[]>([]);
  totalCostUsd = signal(0);
  isLoading = signal(true);
  isExporting = signal(false);

  // Righe espanse (mostrano il dettaglio tecnico completo)
  private expandedIds = signal<Set<string>>(new Set());

  // Opzioni autocomplete ricavate GRATIS dai log già caricati (datalist).
  readonly userEmailOptions = computed(() =>
    Array.from(
      new Set(this.logs().map((l) => l.userEmail).filter((e): e is string => !!e)),
    ).sort(),
  );
  readonly actionOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const l of this.logs()) {
      if (l.action && !seen.has(l.action)) {
        seen.set(l.action, l.actionLabel || l.action);
      }
    }
    return Array.from(seen, ([action, label]) => ({ action, label })).sort(
      (a, b) => a.label.localeCompare(b.label),
    );
  });

  // Filtri (two-way bound nel template)
  filters: LogsFilters = {
    userEmail: '',
    action: '',
    category: '',
    status: '',
    traceId: '',
    from: '',
    to: '',
    limit: 100,
  };

  readonly errorCount = computed(
    () => this.logs().filter((l) => l.status === 'error').length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const f = this.cleanFilters();

    this.logsService.getLogs(f).subscribe({
      next: (res) => {
        if (res.success) this.logs.set(res.logs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading logs', err);
        this.isLoading.set(false);
        this.feedbackService.showFeedback('Errore nel caricamento dei log', false);
      },
    });

    // Riepilogo costi: condivide i filtri temporali e organizzazione
    this.logsService
      .getCostSummary({
        organizationId: f.organizationId,
        from: f.from,
        to: f.to,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.costModels.set(res.models);
            this.totalCostUsd.set(res.totalCostUsd);
          }
        },
        error: (err) => console.error('Error loading cost summary', err),
      });
  }

  resetFilters(): void {
    this.filters = {
      userEmail: '',
      action: '',
      category: '',
      status: '',
      traceId: '',
      from: '',
      to: '',
      limit: 100,
    };
    this.load();
  }

  // --- Righe espandibili (dettaglio tecnico) ---

  toggleExpand(id: string): void {
    const next = new Set(this.expandedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedIds.set(next);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  private cleanFilters(): LogsFilters {
    const f: LogsFilters = {};
    Object.entries(this.filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') (f as any)[k] = v;
    });
    return f;
  }

  // --- Helpers di presentazione ---

  categoryBadgeClass(category: string): string {
    switch (category) {
      case 'http':
        return 'badge bg-primary-subtle text-primary';
      case 'ai':
        return 'badge bg-info-subtle text-info';
      case 'system':
        return 'badge bg-secondary-subtle text-secondary';
      case 'client':
        return 'badge bg-warning-subtle text-warning';
      default:
        return 'badge bg-light text-dark';
    }
  }

  categoryIcon(category: string) {
    switch (category) {
      case 'ai':
        return faRobot;
      case 'system':
        return faGears;
      case 'client':
        return faDisplay;
      default:
        return faGlobe;
    }
  }

  statusBadgeClass(status: string | undefined): string {
    return status === 'error'
      ? 'badge bg-danger text-white'
      : 'badge bg-success text-white';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/D';
    return new Date(dateString).toLocaleString('it-IT');
  }

  formatTokens(n: number | undefined): string {
    if (!n) return '—';
    return n.toLocaleString('it-IT');
  }

  formatCost(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    return '$' + n.toFixed(6);
  }

  /**
   * Esporta i log con i filtri correnti. CSV/JSON → download file;
   * descrittivo → apre il report HTML in una nuova scheda, pronto per
   * "Stampa → Salva come PDF". Best-effort, feedback su errore.
   */
  exportAs(format: ExportFormat): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    this.logsService.exportLogs(this.cleanFilters(), format).subscribe({
      next: (res) => {
        this.isExporting.set(false);
        if (!res.success) return;

        if (format === 'descriptive') {
          const url = URL.createObjectURL(
            new Blob([res.content], { type: res.mimeType }),
          );
          window.open(url, '_blank');
          // Lascia il tempo alla scheda di caricare prima di revocare.
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          this.downloadFile(res.content, res.filename, res.mimeType);
        }
      },
      error: (err) => {
        console.error('Error exporting logs', err);
        this.isExporting.set(false);
        this.feedbackService.showFeedback("Errore durante l'export", false);
      },
    });
  }

  private downloadFile(content: string, filename: string, mime: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Riassume il payload di un evento client in `chiave: valore` compatti. */
  formatPayload(payload: Record<string, unknown> | undefined): string {
    if (!payload) return '';
    return Object.entries(payload)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
}
