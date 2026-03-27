import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSparkles, faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-ai-overlay',
  imports: [FontAwesomeModule],
  templateUrl: './ai-overlay.html',
  styleUrl: './ai-overlay.scss',
})
export class AiOverlay {
  visible = input.required<boolean>();
  success = input<boolean>(false);

  loadingTitle = input<string>('Operazione in corso...');
  loadingSubtitle = input<string>(
    'Non tornare indietro e non chiudere la pagina,\naltrimenti andrà perduta.',
  );

  successTitle = input<string>('Operazione completata!');
  successMessage = input<string>('Il tuo contenuto è pronto.');

  /** Label for the optional CTA button shown in the success state.
   *  Leave empty (default) to hide the button. */
  ctaLabel = input<string>('');

  ctaClick = output<void>();

  protected readonly SparklesIcon = faSparkles;
  protected readonly SpinnerIcon = faSpinnerThird;
}
