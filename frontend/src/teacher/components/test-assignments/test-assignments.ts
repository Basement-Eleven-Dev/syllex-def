import { DatePipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckDouble,
  faEye,
  faXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { SyllexPagination } from '../syllex-pagination/syllex-pagination';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-test-assignments',
  standalone: true, // Assicurati che sia standalone se lo usi negli imports
  imports: [
    FontAwesomeModule,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    ReactiveFormsModule,
    SyllexPagination,
    RouterLink,
  ],
  templateUrl: './test-assignments.html',
  styleUrl: './test-assignments.scss',
})
export class TestAssignments implements OnChanges {
  // --- AGGIUNGI L'INPUT QUI ---
  @Input() attempts: any[] = [];

  EyeIcon = faEye;
  ChecksIcon = faCheckDouble;
  ClearIcon = faXmark;

  // Signal per gestire i dati filtrati
  filteredAssignments = signal<any[]>([]);

  filtersForm: FormGroup = new FormGroup({
    text: new FormControl(''),
    class: new FormControl(''),
    status: new FormControl(''),
  });

  page: number = 1;
  pageSize: number = 5;

  // La dimensione della collezione ora dipende dai dati reali
  get collectionSize(): number {
    return this.filteredAssignments().length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attempts']) {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    const { text, status } = this.filtersForm.value;

    let data = [...this.attempts];

    // Filtro testuale (Nome/Cognome)
    if (text) {
      const search = text.toLowerCase();
      data = data.filter(
        (a) =>
          a.studentName?.toLowerCase().includes(search) ||
          a.studentLastName?.toLowerCase().includes(search),
      );
    }

    // Filtro Stato
    if (status) {
      data = data.filter((a) =>
        status === 'delivered'
          ? a.status === 'delivered'
          : a.status !== 'delivered',
      );
    }

    this.filteredAssignments.set(data);
  }

  onNewPageRequested() {
    // Logica paginazione (opzionale se gestita lato client)
  }

  resetFilters(): void {
    this.filtersForm.reset({ text: '', class: '', status: '' });
    this.applyFilters();
  }
}
