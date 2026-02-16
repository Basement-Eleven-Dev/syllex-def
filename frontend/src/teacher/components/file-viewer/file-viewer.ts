import { Component, computed, Input, signal } from '@angular/core';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-viewer',
  imports: [NgxDocViewerModule, CommonModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.scss',
})
export class FileViewer {
  @Input() docUrl: string = '';
  @Input() extension: string = '';

  isBlobUrl = computed(() => this.docUrl.startsWith('blob:'));

  isImage = computed(() =>
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      this.extension.toLowerCase(),
    ),
  );

  isPdf = computed(() => this.extension.toLowerCase() === 'pdf');
}
