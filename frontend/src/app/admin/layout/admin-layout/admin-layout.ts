import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TourStepTemplateComponent, TourService } from 'ngx-ui-tour-ng-bootstrap';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { Auth } from '../../../../services/auth';
import { AdminNavbar } from '../../components/admin-navbar/admin-navbar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule, AdminSidebar, AdminNavbar, TourStepTemplateComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  private authService = inject(Auth);
  private router = inject(Router);
  public tourService = inject(TourService);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.tourService.initialize([
      {
        anchorId: 'admin-dashboard',
        title: 'Dashboard',
        content: 'Qui puoi vedere a colpo d\'occhio le statistiche generali dell\'attività sulla piattaforma.',
        placement: 'right',
        route: '/a/dashboard'
      },
      {
        anchorId: 'admin-organizations',
        title: 'Organizzazioni',
        content: 'Gestisci le scuole e gli istituti associati. Selezionane una per vederne i dettagli.',
        placement: 'right',
        route: '/a/organizzazioni'
      },
      {
        anchorId: 'admin-stats',
        title: 'Statistiche',
        content: 'Analizza nel dettaglio le performance globali e l\'utilizzo dei servizi AI.',
        placement: 'right',
        route: '/a/stats'
      },
      {
        anchorId: 'admin-profile',
        title: 'Profilo',
        content: 'Aggiorna i tuoi dati o termina la sessione da qui.',
        placement: 'bottom',
      }
    ]);

    this.tourService.start$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.add('tour-active');
    });

    this.tourService.end$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      document.body.classList.remove('tour-active');
      localStorage.setItem('syllex_admin_tour_completed', 'true');
    });

    if (!localStorage.getItem('syllex_admin_tour_completed')) {
      setTimeout(() => this.tourService.start(), 500);
    }
  }

  onLogout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
