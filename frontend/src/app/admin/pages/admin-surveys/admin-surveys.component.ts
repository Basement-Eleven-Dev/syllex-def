import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SurveyService, Survey } from '../../service/survey.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faPen, faEye, faLink, faCheck, faTimes } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-admin-surveys',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './admin-surveys.component.html',
  styleUrl: './admin-surveys.component.scss'
})
export class AdminSurveysComponent implements OnInit {
  private surveyService = inject(SurveyService);
  
  surveys: Survey[] = [];
  loading = true;

  // Icons
  faPlus = faPlus;
  faPen = faPen;
  faEye = faEye;
  faLink = faLink;
  faCheck = faCheck;
  faTimes = faTimes;

  ngOnInit() {
    this.loadSurveys();
  }

  loadSurveys() {
    this.loading = true;
    this.surveyService.getSurveys().subscribe({
      next: (res) => {
        this.surveys = res.surveys;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  copyLink(slug: string) {
    const url = `${window.location.origin}/survey/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiato negli appunti: ' + url);
    });
  }
}
