import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { Nav } from '../../../../teacher/components/nav/nav';
import { Auth } from '../../../../services/auth';
import { AdminNavbar } from '../../components/admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [FontAwesomeModule, RouterModule, AdminSidebar, AdminNavbar],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  private authService = inject(Auth);
  private router = inject(Router);

  onLogout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
