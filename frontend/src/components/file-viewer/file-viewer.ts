import { Component, Input } from '@angular/core';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

@Component({
  selector: 'app-file-viewer',
  imports: [NgxDocViewerModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.scss',
})
export class FileViewer {
  @Input() docUrl: string = '';
  @Input() extension: string = '';
}
