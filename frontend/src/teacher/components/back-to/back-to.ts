import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-back-to',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './back-to.html',
  styleUrl: './back-to.scss',
})
export class BackTo {
  ArrowLeftIcon = faArrowLeft;
  @Input() path: string = '/';
  @Input() label: string = 'Torna alla lista';
}
