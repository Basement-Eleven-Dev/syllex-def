import { Component, computed, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-syllex-pagination',
  imports: [FontAwesomeModule],
  templateUrl: './syllex-pagination.html',
  styleUrl: './syllex-pagination.scss',
})
export class SyllexPagination {
  readonly ChevronLeft = faChevronLeft;
  readonly ChevronRight = faChevronRight;

  collectionSize = input.required<number>();
  page = input.required<number>();
  pageSize = input.required<number>();
  pageChange = output<number>();

  maxVisiblePages = input<number>(5);

  totalPages = computed(() => {
    return Math.ceil(this.collectionSize() / this.pageSize());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const max = this.maxVisiblePages();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  selectorPosition = computed(() => {
    const pages = this.visiblePages();
    const currentPage = this.page();
    const index = pages.indexOf(currentPage);
    if (index === -1) return 0;
    return (index * 100) / pages.length;
  });

  selectorWidth = computed(() => {
    const pages = this.visiblePages();
    return 100 / pages.length;
  });

  onPageClick(page: number): void {
    if (page !== this.page()) {
      this.pageChange.emit(page);
    }
  }

  onPrevious(): void {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  onNext(): void {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}
