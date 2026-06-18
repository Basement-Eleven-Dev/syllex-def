import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGlobe } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule, FontAwesomeModule],
  templateUrl: './language-selector.html',
})
export class LanguageSelector {
  public translocoService = inject(TranslocoService);
  GlobeIcon = faGlobe;

  get currentLanguage() {
    return this.translocoService.getActiveLang();
  }

  changeLanguage(lang: string) {
    this.translocoService.setActiveLang(lang);
    localStorage.setItem('syllex-language', lang);
  }
}
