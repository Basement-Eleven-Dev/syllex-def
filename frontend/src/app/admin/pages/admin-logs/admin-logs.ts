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
  faCoins,
  faSliders,
} from '@fortawesome/pro-solid-svg-icons';
import {
  LogsService,
  ActivityLog,
  LogsFilters,
  CostSummaryModel,
  ExportFormat,
} from '../../service/logs-service';
import { FeedbackService } from '../../../../services/feedback-service';

type ViewMode = 'all' | 'client' | 'ai' | 'error';
type TimePreset = '1h' | 'today' | '7d' | 'all' | 'custom';

const PAGE_SIZE = 50;

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
  readonly CoinsIcon = faCoins;
  readonly SlidersIcon = faSliders;

  logs = signal<ActivityLog[]>([]);
  costModels = signal<CostSummaryModel[]>([]);
  totalCostUsd = signal(0);
  isLoading = signal(true);
  isExporting = signal(false);
  hasMore = signal(false);

  // Vista corrente (filtro a un clic) e finestra temporale
  viewMode = signal<ViewMode>('all');
  timePreset = signal<TimePreset>('all');
  showAdvanced = signal(false);
  showCostDetail = signal(false);

  // Righe espanse (dettaglio tecnico completo)
  private expandedIds = signal<Set<string>>(new Set());

  // Filtri inviati al backend
  filters: LogsFilters = {
    userEmail: '',
    action: '',
    category: '',
    status: '',
    traceId: '',
    from: '',
    to: '',
    limit: PAGE_SIZE,
  };

  // Range personalizzato (datetime-local) — applicato su richiesta
  customFrom = '';
  customTo = '';

  // Autocomplete ricavati GRATIS dai log già caricati
  readonly userEmailOptions = computed(() =>
    Array.from(
      new Set(
        this.logs()
          .map((l) => l.userEmail)
          .filter((e): e is string => !!e),
      ),
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
        if (res.success) {
          this.logs.set(res.logs);
          // Se ne ho ricevuti quanti il limite, probabilmente ce ne sono altri
          this.hasMore.set(res.count >= (this.filters.limit ?? PAGE_SIZE));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading logs', err);
        this.isLoading.set(false);
        this.feedbackService.showFeedback(
          'Errore nel caricamento dei log',
          false,
        );
      },
    });

    this.logsService.getCostSummary({ from: f.from, to: f.to }).subscribe({
      next: (res) => {
        if (res.success) {
          this.costModels.set(res.models);
          this.totalCostUsd.set(res.totalCostUsd);
        }
      },
      error: (err) => console.error('Error loading cost summary', err),
    });
  }

  // --- Viste rapide (segmented) ---
  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.filters.category =
      mode === 'client' ? 'client' : mode === 'ai' ? 'ai' : '';
    this.filters.status = mode === 'error' ? 'error' : '';
    this.filters.limit = PAGE_SIZE;
    this.load();
  }

  // --- Preset temporali ---
  setTimePreset(p: TimePreset): void {
    this.timePreset.set(p);
    const now = Date.now();
    if (p === 'all') {
      this.filters.from = '';
      this.filters.to = '';
    } else if (p === '1h') {
      this.filters.from = new Date(now - 3600_000).toISOString();
      this.filters.to = '';
    } else if (p === 'today') {
      const d = new Date();
      this.filters.from = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      ).toISOString();
      this.filters.to = '';
    } else if (p === '7d') {
      this.filters.from = new Date(now - 7 * 86400_000).toISOString();
      this.filters.to = '';
    }
    this.customFrom = '';
    this.customTo = '';
    this.filters.limit = PAGE_SIZE;
    this.load();
  }

  // Range personalizzato: datetime-local → ISO (timezone-correct)
  applyCustomRange(): void {
    this.filters.from = this.customFrom
      ? new Date(this.customFrom).toISOString()
      : '';
    this.filters.to = this.customTo ? new Date(this.customTo).toISOString() : '';
    this.timePreset.set('custom');
    this.filters.limit = PAGE_SIZE;
    this.load();
  }

  applyFilters(): void {
    this.filters.limit = PAGE_SIZE;
    this.load();
  }

  loadMore(): void {
    this.filters.limit = (this.filters.limit ?? PAGE_SIZE) + PAGE_SIZE;
    this.load();
  }

  toggleAdvanced(): void {
    this.showAdvanced.update((v) => !v);
  }

  toggleCostDetail(): void {
    this.showCostDetail.update((v) => !v);
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
      limit: PAGE_SIZE,
    };
    this.customFrom = '';
    this.customTo = '';
    this.viewMode.set('all');
    this.timePreset.set('all');
    this.load();
  }

  private cleanFilters(): LogsFilters {
    const f: LogsFilters = {};
    Object.entries(this.filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') (f as any)[k] = v;
    });
    return f;
  }

  // --- Righe espandibili ---
  toggleExpand(id: string): void {
    const next = new Set(this.expandedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedIds.set(next);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  // --- Export ---
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

  // --- Presentazione ---
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
      : 'badge bg-success-subtle text-success';
  }

  /** Ora HH:mm:ss (informazione primaria nella timeline). */
  formatTime(d: string | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('it-IT');
  }

  /** Giorno gg/mm/aa (secondario). */
  formatDay(d: string | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }

  formatDate(d: string | undefined): string {
    if (!d) return 'N/D';
    return new Date(d).toLocaleString('it-IT');
  }

  formatTokens(n: number | undefined): string {
    if (!n) return '—';
    return n.toLocaleString('it-IT');
  }

  formatCost(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    return '$' + n.toFixed(6);
  }

  formatPayload(payload: Record<string, unknown> | undefined): string {
    if (!payload) return '';
    return Object.entries(payload)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
}
