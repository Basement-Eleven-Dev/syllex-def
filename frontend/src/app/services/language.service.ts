import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translocoService = inject(TranslocoService);
  private readonly LANG_KEY = 'app_language';

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    const savedLang = localStorage.getItem(this.LANG_KEY);
    if (savedLang) {
      this.translocoService.setActiveLang(savedLang);
    } else {
      // Default lang is already set in app.config.ts to 'it'
      // but we could also detect browser language here if needed.
    }
  }

  setLanguage(lang: string): void {
    this.translocoService.setActiveLang(lang);
    localStorage.setItem(this.LANG_KEY, lang);
  }

  getCurrentLanguage(): string {
    return this.translocoService.getActiveLang();
  }

  getAvailableLanguages(): string[] {
    const langs = this.translocoService.getAvailableLangs();
    return langs.map(l => typeof l === 'string' ? l : (l as any).id);
  }
}
