import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../../environments/environment';
import { Auth } from '../../../services/auth';
import { faArrowLeft, faCheck, faCircleCheck, faClipboard } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-survey-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './survey-page.component.html',
  styleUrl: './survey-page.component.scss'
})
export class SurveyPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  faClipboard = faClipboard;
  arrowLeft = faArrowLeft;
  circleCheck = faCircleCheck;
  auth = inject(Auth);

  slug: string | null = null;
  survey: any = null;
  loading = true;
  error: string | null = null;
  submitted = false;
  submitting = false;

  answers: any = {};
  currentStepIndex = 0;

  get currentField() {
    return this.survey?.fields?.[this.currentStepIndex];
  }

  get isLastStep() {
    return this.survey?.fields && this.currentStepIndex === this.survey.fields.length - 1;
  }

  nextStep() {
    const field = this.currentField;
    if (field?.required) {
      const ans = this.answers[field.id];
      if (ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
        alert("Compila questo campo prima di procedere.");
        return;
      }
    }
    if (this.currentStepIndex < this.survey.fields.length - 1) {
      this.currentStepIndex++;
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }

  toggleCheckbox(fieldId: string, option: string) {
    if (!Array.isArray(this.answers[fieldId])) {
      this.answers[fieldId] = [];
    }
    const idx = this.answers[fieldId].indexOf(option);
    if (idx > -1) {
      this.answers[fieldId].splice(idx, 1);
    } else {
      this.answers[fieldId].push(option);
    }
  }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug');
    if (this.slug) {
      this.loadSurvey();
    } else {
      this.error = "Questionario non trovato.";
      this.loading = false;
    }
  }

  async loadSurvey() {
    await this.auth.whenReady;

    this.http.get<any>(`${apiUrl}/public/surveys/${this.slug}`).subscribe({
      next: (res) => {
        if (res.success && res.survey) {
          this.survey = res.survey;
          
          if (!this.survey.isAnonymous && !this.auth.user) {
            // Reindirizza al login
            this.router.navigate(['/'], { queryParams: { returnUrl: `/survey/${this.slug}` }});
            return;
          }

          // Inizializza answers
          for (let field of this.survey.fields) {
            if (field.type === 'checkbox') {
              this.answers[field.id] = [];
            } else {
              this.answers[field.id] = null;
            }
          }
          this.loading = false;
        } else {
          this.error = res.message || "Questionario non trovato.";
          this.loading = false;
        }
      },
      error: () => {
        this.error = "Errore di connessione.";
        this.loading = false;
      }
    });
  }

  submit() {
    // Validazione base
    for (let field of this.survey.fields) {
      if (field.required) {
        const ans = this.answers[field.id];
        if (ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
          alert("Compila tutti i campi obbligatori.");
          return;
        }
      }
    }

    this.submitting = true;
    
    this.http.post<any>(`${apiUrl}/public/surveys/${this.slug}/submit`, {
      answers: this.answers
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.submitted = true;
        } else {
          alert("Errore durante l'invio.");
        }
      },
      error: () => {
        this.submitting = false;
        alert("Errore durante l'invio.");
      }
    });
  }
}
