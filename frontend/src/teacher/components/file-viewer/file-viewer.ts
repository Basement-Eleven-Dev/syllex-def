import { Component, computed, Input, signal } from '@angular/core';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinnerThird } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [NgxDocViewerModule, CommonModule, FontAwesomeModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.scss',
})
export class FileViewer {
  @Input() docUrl: string = '';
  @Input() extension: string = '';

  readonly isLoading = signal<boolean>(true);
  readonly SpinnerIcon = faSpinnerThird;

  isBlobUrl = computed(() => this.docUrl.startsWith('blob:'));

  isImage = computed(() =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      this.extension.toLowerCase(),
    ),
  );

  isPdf = computed(() => this.extension.toLowerCase() === 'pdf');

  onLoad(): void {
    this.isLoading.set(false);
  }
}
