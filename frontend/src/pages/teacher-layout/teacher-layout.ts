import { Component, signal, inject, effect } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { Materia } from '../../services/materia';
import { routeTransitionAnimation } from '../../app/animations/route-transition';

@Component({
  selector: 'app-teacher-layout',
  imports: [Nav, Sidebar, RouterOutlet, FontAwesomeModule],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
  animations: [routeTransitionAnimation],
})
export class TeacherLayout {
  SpinnerIcon = faSpinnerThird;
  showLoading = signal<boolean>(false);
  public materia = inject(Materia);
  private contexts = inject(ChildrenOutletContexts);
  private isFirstRun = true;

  constructor() {
    // Usa effect per reagire ai cambiamenti di materiaSelected
    effect(() => {
      const selected = this.materia.materiaSelected();

      // Ignora il primo run (caricamento iniziale)
      if (this.isFirstRun) {
        this.isFirstRun = false;
        return;
      }

      // Solo quando l'utente cambia effettivamente la materia
      if (selected) {
        this.showLoading.set(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    });
  }

  getRouteAnimationState() {
    return this.contexts
      .getContext('primary')
      ?.route?.snapshot?.url?.toString();
  }
}
