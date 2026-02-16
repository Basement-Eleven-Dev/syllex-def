import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { StudentPerformanceData } from '../../../services/class-statistics.service';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';

@Component({
  selector: 'app-studenti-classe-table',
  imports: [FontAwesomeModule, SyllexPagination, FormsModule, RouterLink],
  templateUrl: './studenti-classe-table.html',
  styleUrl: './studenti-classe-table.scss',
})
export class StudentiClasseTable {
  // Inputs
  classeId = input.required<string>();
  testsCount = input.required<number>();
  students = input.required<StudentPerformanceData[]>();

  // Icons
  readonly EyeIcon = faEye;

  // Local state
  private readonly SearchTerm = signal<string>('');
  private readonly CurrentPage = signal<number>(1);
  private readonly PageSize = signal<number>(5);

  // Computed values
  readonly FilteredStudents = computed(() => {
    const term = this.SearchTerm().toLowerCase();
    if (!term) return this.students();

    return this.students().filter((data) => {
      const student = data.Student;
      const fullName =
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const username = (student.username || '').toLowerCase();
      return fullName.includes(term) || username.includes(term);
    });
  });

  readonly CollectionSize = computed(() => this.FilteredStudents().length);

  readonly PaginatedStudents = computed(() => {
    const filtered = this.FilteredStudents();
    const startIndex = (this.CurrentPage() - 1) * this.PageSize();
    const endIndex = startIndex + this.PageSize();
    return filtered.slice(startIndex, endIndex);
  });

  readonly HasNoStudents = computed(
    () => this.PaginatedStudents().length === 0,
  );

  // Public getters for template
  searchTerm = this.SearchTerm.asReadonly();
  page = this.CurrentPage.asReadonly();
  pageSize = this.PageSize.asReadonly();
  collectionSize = this.CollectionSize;
  paginatedStudents = this.PaginatedStudents;

  onSearchChange(term: string): void {
    this.SearchTerm.set(term);
    this.CurrentPage.set(1);
  }

  onPageChange(newPage: number): void {
    this.CurrentPage.set(newPage);
  }

  onPageSizeChange(newSize: number): void {
    this.PageSize.set(newSize);
    this.CurrentPage.set(1);
  }

  getStudentAvatarUrl(firstName: string, lastName: string): string {
    const seed = `${firstName} ${lastName}`;
    return `https://api.dicebear.com/9.x/initials/svg?backgroundColor=3931ce&textColor=ffffff&seed=${seed}`;
  }
}
