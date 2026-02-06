import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';
import { Materia } from '../../services/materia';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { routeTransitionAnimation } from '../../app/animations/route-transition';

@Component({
  selector: 'app-teacher-layout',
  imports: [Nav, Sidebar, RouterOutlet, FontAwesomeModule],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
  animations: [routeTransitionAnimation],
})
export class TeacherLayout implements OnInit, OnDestroy {
  SpinnerIcon = faSpinnerThird;
  showLoading = signal<boolean>(false);
  public materia = inject(Materia);
  private contexts = inject(ChildrenOutletContexts);
  private subscription?: Subscription;

  getRouteAnimationState() {
    return this.contexts
      .getContext('primary')
      ?.route?.snapshot?.url?.toString();
  }

  ngOnInit(): void {
    // Skip(1) per ignorare il valore iniziale emesso dal BehaviorSubject
    this.subscription = this.materia.materiaSelected
      .pipe(skip(1))
      .subscribe(() => {
        this.showLoading.set(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
