import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NgbToastModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeedbackService } from '../services/feedback-service';
import { Auth } from '../services/auth';
import { TermsModalComponent } from './policy-acceptance-modal/policy-acceptance-modal.component';
import { TERMS_VERSION } from './_utils/terms-version';
import { TranslocoService } from '@jsverse/transloco';
import { TelemetryService } from '../services/telemetry-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgbToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Syllex';
  protected readonly feedbackService = inject(FeedbackService);
  protected readonly authService = inject(Auth);
  private readonly modalService = inject(NgbModal);
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly telemetry = inject(TelemetryService);
  private termsModalOpen = false;
  private lastTrackedPath = '';

  ngOnInit() {
    const savedLang = localStorage.getItem('syllex-language');
    if (savedLang) {
      this.translocoService.setActiveLang(savedLang);
    }

    // Telemetria navigazione: traccia il cambio di pagina (path senza query,
    // per non finire dati sensibili nei log). Dedup su path identici.
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = (e.urlAfterRedirects || e.url).split('?')[0];
        if (path === this.lastTrackedPath) return;
        this.lastTrackedPath = path;
        this.telemetry.track({ action: 'navigation', payload: { path } });
      });

    this.authService.user$.subscribe((user) => {
      if (!user) return;
      const needsAcceptance = user.termsAcceptation?.version !== TERMS_VERSION;
      if (needsAcceptance && !this.termsModalOpen) {
        this.openPolicyModal();
      }
    });
  }

  private openPolicyModal() {
    this.termsModalOpen = true;
    const ref = this.modalService.open(TermsModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });
    ref.result.then(() => {
      this.termsModalOpen = false;
    });
  }
}
