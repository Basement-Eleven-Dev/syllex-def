import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTimes,
  faUpRightFromSquare,
  faExpand,
  faCompress,
} from '@fortawesome/pro-solid-svg-icons';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-pptx-presenter',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './pptx-presenter.html',
  styleUrl: './pptx-presenter.scss',
})
export class PptxPresenter implements OnInit {
  @Input() docUrl = '';
  @Input() title = 'Presentazione';

  @ViewChild('slideIframe') slideIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('presenterContainer') presenterContainer!: ElementRef<HTMLElement>;

  readonly activeModal = inject(NgbActiveModal);
  private readonly sanitizer = inject(DomSanitizer);

  readonly CloseIcon = faTimes;
  readonly ExternalIcon = faUpRightFromSquare;
  readonly FullscreenIcon = faExpand;
  readonly ExitFullscreenIcon = faCompress;
  readonly SpinnerIcon = faSpinnerThird;

  readonly isLoading = signal(true);
  readonly isFullscreen = signal(false);
  embedUrl: SafeResourceUrl | null = null;

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  ngOnInit(): void {
    if (!this.docUrl) return;

    const officeEmbedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(this.docUrl)}`;
    this.embedUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(officeEmbedUrl);
  }

  onIframeLoad(): void {
    this.isLoading.set(false);
  }

  async toggleFullscreen(): Promise<void> {
    const container = this.presenterContainer?.nativeElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  openInNewTab(): void {
    const fullViewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(this.docUrl)}`;
    window.open(fullViewUrl, '_blank');
  }
}
