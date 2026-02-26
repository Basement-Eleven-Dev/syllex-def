import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { DashboardSuperAdmin } from '../../components/dashboard-super-admin/dashboard-super-admin';
import { DashboardAdmin } from '../../components/dashboard-admin/dashboard-admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    RouterModule, 
    DashboardSuperAdmin, 
    DashboardAdmin
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  public auth = inject(Auth);

  icons = {
    faUserCheck,
  };
}
