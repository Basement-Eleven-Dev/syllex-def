import {
  Component,
  computed,
  Input,
  signal,
  inject,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird, faExpandArrowsAlt } from '@fortawesome/pro-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [CommonModule, NgxDocViewerModule, FontAwesomeModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.scss',
})
export class FileViewer implements OnChanges, OnInit, OnDestroy {
  private http = inject(HttpClient);

  @Input() docUrl: string = '';
  @Input() extension: string = '';
  @Input() isMap: boolean = false;

  @ViewChild('mermaidContainer') mermaidContainer!: ElementRef<HTMLElement>;

  readonly isLoading = signal(true);
  readonly SpinnerIcon = faSpinnerThird;
  readonly ResetIcon = faExpandArrowsAlt;
  readonly mermaidContent = signal<string | null>(null);
  
  private panZoomInstance: SvgPanZoom.Instance | null = null;

  isBlobUrl = computed(() => this.docUrl?.startsWith('blob:'));

  isImage = computed(() =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      this.extension?.toLowerCase(),
    ),
  );

  isPdf = computed(() => this.extension?.toLowerCase() === 'pdf');

  constructor() {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'forest',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 60,
        rankSpacing: 60,
        padding: 40, // Margine interno generoso per evitare sovrapposizioni dei titoli
        useMaxWidth: false,
      },
      themeVariables: {
        fontSize: '14px',
        primaryColor: '#4597e9ff',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#1d63a8',
        lineColor: '#5a6268',
        secondaryColor: '#fcee87ff',
        tertiaryColor: '#d4edda',
        mainBkg: '#ffffff',
        nodeBkg: '#fff9db', // Giallo pastello vivace chiesto dall'utente
        nodeBorder: '#fab005', // Bordo marcato per contrasto
        clusterBkg: '#ffffff',
        clusterBorder: '#adb5bd',
        defaultLinkColor: '#495057',
        titleColor: '#212529',
        edgeLabelBackground: '#ffffff'
      }
    });
  }

  ngOnInit(): void {
    if (this.docUrl && this.isMap) {
      this.loadMapContent();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['docUrl'] || changes['isMap']) &&
      this.docUrl &&
      this.isMap
    ) {
      this.loadMapContent();
    }
  }

  ngOnDestroy(): void {
    this.destroyPanZoom();
  }

  resetZoom(): void {
    if (this.panZoomInstance) {
      this.panZoomInstance.reset();
      this.panZoomInstance.center();
      this.panZoomInstance.fit();
    }
  }

  private destroyPanZoom(): void {
    if (this.panZoomInstance) {
      this.panZoomInstance.destroy();
      this.panZoomInstance = null;
    }
  }

  private async loadMapContent(): Promise<void> {
    this.isLoading.set(true);

    try {
      const content = await this.http
        .get(this.docUrl, { responseType: 'text' })
        .toPromise();

      if (!content) return;

      this.mermaidContent.set(content);

      // renderizza subito
      setTimeout(() => this.renderMermaid(), 0);
    } catch (e) {
      console.error('Errore caricamento mappa:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async renderMermaid(): Promise<void> {
    let content = this.mermaidContent();
    if (!content || !this.mermaidContainer) return;

    this.destroyPanZoom();

    
const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

content = content.replace(/(\[[^"\]\n]+\])/g, (match) => {
  const inner = match.slice(1, -1);
  if (inner.includes(':') || inner.includes('(') || inner.includes(')')) {
    return `["${escapeHtml(inner)}"]`;
  }
  return match;
});

    const el = this.mermaidContainer.nativeElement;
    el.innerHTML = '';

    try {
      await mermaid.parse(content);

      const id = `mermaid-${crypto.randomUUID()}`;
      const { svg } = await mermaid.render(id, content);

      el.innerHTML = svg;

      const svgEl = el.querySelector('svg');
      if (svgEl) {
        // ESPANSIONE MANUALE VIEWBOX: 
        // Aggiungiamo spazio extra su tutti i lati per evitare clipping dei titoli
        const currentViewBox = svgEl.getAttribute('viewBox');
        if (currentViewBox) {
          const [x, y, w, h] = currentViewBox.split(' ').map(Number);
          const margin = 200; // Margine abbondante per sicurezza
          svgEl.setAttribute('viewBox', `${x - margin} ${y - margin} ${w + margin * 2} ${h + margin * 2}`);
        }

        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.maxWidth = 'none';
        
        // Inizializziamo il pan-zoom
        this.panZoomInstance = svgPanZoom(svgEl, {
          zoomEnabled: true,
          controlIconsEnabled: false, 
          fit: true,
          center: true,
          minZoom: 0.1,
          maxZoom: 10,
        });
      }
    } catch (e: any) {
      console.error('Mermaid rendering error:', e);
      el.innerHTML = `
        <div class="alert alert-danger m-3 shadow-sm">
          <h6 class="alert-heading fw-bold">Errore di Sintassi Mermaid</h6>
          <p class="small mb-2">Il codice del grafico non è valido. Verifica la sintassi e riprova.</p>
          <hr>
          <pre class="mb-0 overflow-auto" style="max-height: 250px; font-size: 0.8rem; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px;">${content}</pre>
          <div class="mt-2 x-small text-muted italic">${e?.message || e?.str || 'Errore sconosciuto'}</div>
        </div>
      `;
    } finally {
      this.isLoading.set(false);
    }
  }

  onLoad(): void {
    this.isLoading.set(false);
  }
}