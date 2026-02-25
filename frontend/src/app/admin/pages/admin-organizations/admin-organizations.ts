import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Auth } from '../../../../services/auth';
import { 
  faLandmark, 
  faPlus, 
  faChevronRight, 
  faUsers, 
  faUserTie, 
  faBook,
  faSearch
} from '@fortawesome/pro-solid-svg-icons';
import { OnboardingService } from '../../service/onboarding-service';
import { FeedbackService } from '../../../../services/feedback-service';

@Component({
  selector: 'app-admin-organizations',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './admin-organizations.html',
  styleUrl: './admin-organizations.scss',
})
export class AdminOrganizations implements OnInit {
  private onboardingService = inject(OnboardingService);
  private feedbackService = inject(FeedbackService);
  private auth = inject(Auth);
  private router = inject(Router);

  organizations: any[] = [];
  loading = true;
  searchTerm = '';

  icons = {
    faLandmark,
    faPlus,
    faChevronRight,
    faUsers,
    faUserTie,
    faBook,
    faSearch
  };

  ngOnInit() {
    if (!this.auth.isSuperAdmin) {
      const orgId = this.auth.user?.organizationId || this.auth.user?.organizationIds?.[0];
      if (orgId) {
        this.router.navigate(['/a/organizzazioni', orgId]);
        return;
      }
    }
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.loading = true;
    this.onboardingService.getOrganizations().subscribe({
      next: (res) => {
        this.organizations = res.organizations;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        this.feedbackService.showFeedback('Errore nel caricamento delle organizzazioni', false);
        this.loading = false;
      }
    });
  }

  get filteredOrganizations() {
    if (!this.searchTerm) return this.organizations;
    return this.organizations.filter(org => 
      org.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
  }
}
