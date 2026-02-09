import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { NgFor } from '@angular/common';
import { FeedbackService } from '../services/feedback-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgbToastModule, NgFor],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'syllex-def';
  protected readonly feedbackService = inject(FeedbackService);
}
