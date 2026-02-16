import { Component, signal, inject, effect } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { Materia } from '../../../services/materia';
import { FeedbackService } from '../../../services/feedback-service';

@Component({
  selector: 'app-teacher-layout',
  imports: [Nav, Sidebar, RouterOutlet, FontAwesomeModule],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
})
export class TeacherLayout {
  SpinnerIcon = faSpinnerThird;
  showLoading = signal<boolean>(false);
  public materia = inject(Materia);
  private feedbackService = inject(FeedbackService);

  constructor() {
    effect(() => {
      const selected = this.materia.materiaSelected();
      const shouldReload = this.materia.shouldReload();

      if (selected && shouldReload) {
        this.showLoading.set(true);
        this.materia.shouldReload.set(false);
        setTimeout(() => window.location.reload(), 2000);
      }
    });
  }

  ngOnInit() {}
}
