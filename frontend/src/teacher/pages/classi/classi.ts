import { Component, signal, computed, inject } from '@angular/core';
import { Materia } from '../../../services/materia';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faEye,
  faUser,
  faUsers,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import {
  ClassiService,
  ClassInterface,
} from '../../../services/classi-service';
import { RouterModule } from '@angular/router';
import { SyllexPagination } from '../../components/syllex-pagination/syllex-pagination';
import { FormsModule } from '@angular/forms';
import {
  ViewTypeToggle,
  ViewType,
} from '../../components/view-type-toggle/view-type-toggle';
import { BackTo } from '../../components/back-to/back-to';
import {
  KpiCardData,
  SyllexKpiRow,
} from '../../components/UI/syllex-kpi-row/syllex-kpi-row';
import { SyllexPageHeader } from '../../components/UI/syllex-page-header/syllex-page-header';
import { SyllexSearchInput } from '../../components/UI/syllex-search-input/syllex-search-input';
import { SyllexClearButton } from '../../components/UI/syllex-clear-button/syllex-clear-button';
import { SyllexSelectInput } from '../../components/UI/syllex-select-input/syllex-select-input';
import { SyllexEmptyState } from '../../components/UI/syllex-empty-state/syllex-empty-state';

@Component({
  selector: 'app-classi',
  imports: [
    FontAwesomeModule,
    RouterModule,
    SyllexPagination,
    FormsModule,
    ViewTypeToggle,
    SyllexKpiRow,
    SyllexPageHeader,
    SyllexSearchInput,
    SyllexClearButton,
    SyllexSelectInput,
    SyllexEmptyState,
  ],
  templateUrl: './classi.html',
  styleUrl: './classi.scss',
})
export class Classi {
  // Icons
  protected readonly UserIcon = faUser;
  protected readonly UsersIcon = faUsers;
  protected readonly EyeIcon = faEye;
  protected readonly CalendarIcon = faCalendar;
  protected readonly ClearIcon = faXmark;

  protected readonly yearOptions = [
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' },
    { value: '2028', label: '2028' },
    { value: '2029', label: '2029' },
    { value: '2030', label: '2030' },
  ];

  // Dependency Injection
  protected readonly materiaService = inject(Materia);
  protected readonly classiService = inject(ClassiService);

  // View Type
  viewType: ViewType = this.loadViewTypePreference('classi') || 'grid';

  // Signals
  SearchTerm = signal<string>('');
  SelectedYear = signal<number | ''>('');
  Page = signal<number>(1);
  PageSize = signal<number>(10);

  FilteredClassi = computed<ClassInterface[]>(() => {
    const allClassi = this.classiService.classi();
    const search = this.SearchTerm().toLowerCase();
    const year = this.SelectedYear();

    let filtered = allClassi;

    if (search) {
      filtered = filtered.filter((classe) =>
        classe.name.toLowerCase().includes(search),
      );
    }

    if (year) {
      filtered = filtered.filter((classe) => classe.year === year);
    }

    return filtered;
  });

  CollectionSize = computed(() => this.FilteredClassi().length);

  KpiClassi = computed<KpiCardData[]>(() =>
    this.PaginatedClassi().map((classe) => ({
      value: classe.name,
      label: `${classe.students.length} student${classe.students.length === 1 ? 'e' : 'i'}`,
      buttonLabel: 'Visualizza',
      buttonLink: ['/t/classi', classe._id],
    })),
  );

  PaginatedClassi = computed<ClassInterface[]>(() => {
    const filtered = this.FilteredClassi();
    const pageIndex = this.Page();
    const size = this.PageSize();
    const startIndex = (pageIndex - 1) * size;
    const endIndex = startIndex + size;

    return filtered.slice(startIndex, endIndex);
  });

  clearFilters(): void {
    this.SearchTerm.set('');
    this.SelectedYear.set('');
    this.Page.set(1);
  }

  onChangeViewType(type: ViewType): void {
    this.viewType = type;
  }

  private loadViewTypePreference(pageKey: string): ViewType | null {
    try {
      const saved = localStorage.getItem(`viewType_${pageKey}`);
      return saved === 'grid' || saved === 'table' ? saved : null;
    } catch (error) {
      return null;
    }
  }

  onSearchTermChange(value: string): void {
    this.SearchTerm.set(value);
    this.Page.set(1);
  }

  onYearChange(value: string): void {
    this.SelectedYear.set(value ? parseInt(value) : '');
    this.Page.set(1);
  }

  onNewPageRequested(newPage: number): void {
    this.Page.set(newPage);
  }

  onPageSizeChange(newPageSize: number): void {
    this.PageSize.set(newPageSize);
    this.Page.set(1);
  }
}
