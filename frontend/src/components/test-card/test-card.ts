import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { TestData } from '../../pages/test/test';
import { DatePipe, NgClass } from '@angular/common';
import {
  faCheckDouble,
  faClock,
  faEllipsisH,
  faEllipsisVertical,
  faQuestionCircle,
  faUsers,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TestContextualMenu } from '../test-contextual-menu/test-contextual-menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-card',
  imports: [
    DatePipe,
    FontAwesomeModule,
    NgClass,
    TestContextualMenu,
    RouterModule,
  ],
  templateUrl: './test-card.html',
  styleUrl: './test-card.scss',
})
export class TestCard {
  BackgroundIcon = faCheckDouble;
  ClockIcon = faClock;
  UsersIcon = faUsers;
  QuestionsIcon = faQuestionCircle;
  ThreeDotsIcon = faEllipsisVertical;

  @Input() test!: TestData;

  private static currentOpenMenu: TestCard | null = null;

  constructor(private elementRef: ElementRef) {}

  isMenuOpen = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const menuButton =
      this.elementRef.nativeElement.querySelector('.circle-btn');
    const dropdownMenu =
      this.elementRef.nativeElement.querySelector('.dropdown-menu');

    // Se il click è sul bottone del menu, non fare nulla (gestito da toggleMenu)
    if (menuButton && menuButton.contains(target)) {
      return;
    }

    // Se il click è sul menu dropdown, non fare nulla (gestito da onMenuAction)
    if (dropdownMenu && dropdownMenu.contains(target)) {
      return;
    }

    // Per qualsiasi altro click, chiudi questo menu
    if (this.isMenuOpen) {
      this.closeMenu();
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();

    // Chiudi il menu precedentemente aperto se esiste
    if (TestCard.currentOpenMenu && TestCard.currentOpenMenu !== this) {
      TestCard.currentOpenMenu.closeMenu();
    }

    this.isMenuOpen = !this.isMenuOpen;

    // Traccia quale menu è aperto
    TestCard.currentOpenMenu = this.isMenuOpen ? this : null;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  onMenuAction(action: string, event: Event) {
    event.stopPropagation();
    console.log('Menu action:', action);
    // Il menu si chiude automaticamente con il click fuori
  }
}
