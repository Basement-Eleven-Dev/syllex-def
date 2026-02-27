import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExternalLinkAlt, faCalendarAlt, faClipboardCheck, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-attempts-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './student-attempts-table.html',
  styleUrl: './student-attempts-table.scss'
})
export class StudentAttemptsTableComponent {
  @Input() attempts: any[] = [];
  @Input() pagination: any = null;
  @Output() pageChange = new EventEmitter<number>();

  icons = {
    faExternalLinkAlt,
    faCalendarAlt,
    faClipboardCheck,
    faChevronLeft,
    faChevronRight
  };

  getScoreBadgeClass(score: number, maxScore: number) {
    if (score === null || maxScore === 0) return 'bg-secondary';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-success bg-opacity-10 text-success';
    if (percentage >= 60) return 'bg-warning bg-opacity-10 text-warning';
    return 'bg-danger bg-opacity-10 text-danger';
  }

  getStatusBadgeClass(status: string) {
    return status === 'reviewed' ? 'bg-success bg-opacity-10 text-success' : 'bg-info bg-opacity-10 text-info';
  }
}
