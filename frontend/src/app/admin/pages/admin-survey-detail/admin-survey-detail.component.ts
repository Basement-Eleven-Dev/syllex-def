import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SurveyService, Survey, SurveyField, SurveyResponse } from '../../service/survey.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faSave, faPlus, faTrash, faGripVertical, faEye } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-admin-survey-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './admin-survey-detail.component.html',
  styleUrl: './admin-survey-detail.component.scss'
})
export class AdminSurveyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  isNew = false;
  surveyId: string | null = null;
  loading = false;
  activeTab: 'editor' | 'responses' = 'editor';

  survey: Partial<Survey> = {
    title: '',
    description: '',
    slug: '',
    active: true,
    isAnonymous: false,
    fields: []
  };

  responses: SurveyResponse[] = [];
  selectedResponse: SurveyResponse | null = null;

  // Icons
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faPlus = faPlus;
  faTrash = faTrash;
  faGripVertical = faGripVertical;
  faEye = faEye;

  ngOnInit() {
    this.surveyId = this.route.snapshot.paramMap.get('id');
    if (this.surveyId === 'new') {
      this.isNew = true;
    } else if (this.surveyId) {
      this.loadSurvey();
      this.loadResponses();
    }
  }

  loadSurvey() {
    this.loading = true;
    this.surveyService.getSurveyById(this.surveyId!).subscribe({
      next: (res) => {
        this.survey = res.survey;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadResponses() {
    this.surveyService.getSurveyResponses(this.surveyId!).subscribe({
      next: (res) => {
        this.responses = res.responses;
      }
    });
  }

  addField() {
    if (!this.survey.fields) this.survey.fields = [];
    this.survey.fields.push({
      id: 'field_' + Math.random().toString(36).substr(2, 9),
      type: 'text',
      label: 'Nuova Domanda',
      required: false
    });
  }

  removeField(index: number) {
    this.survey.fields?.splice(index, 1);
  }

  save() {
    if (!this.survey.title || !this.survey.slug) {
      alert("Titolo e slug (URL) sono obbligatori");
      return;
    }

    this.loading = true;
    if (this.isNew) {
      this.surveyService.createSurvey(this.survey).subscribe({
        next: (res) => {
          this.router.navigate(['/a/surveys']);
        },
        error: (err) => {
          this.loading = false;
          alert("Errore durante il salvataggio");
        }
      });
    } else {
      this.surveyService.updateSurvey(this.surveyId!, this.survey).subscribe({
        next: (res) => {
          this.survey = res.survey;
          this.loading = false;
          alert("Salvato con successo");
        },
        error: (err) => {
          this.loading = false;
          alert("Errore durante il salvataggio");
        }
      });
    }
  }

  preview() {
    if (!this.survey.slug) return;
    const url = `${window.location.origin}/survey/${this.survey.slug}`;
    window.open(url, '_blank');
  }

  viewResponse(resp: SurveyResponse) {
    this.selectedResponse = resp;
  }

  closeResponse() {
    this.selectedResponse = null;
  }
}
