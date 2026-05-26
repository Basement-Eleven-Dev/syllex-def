import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-syllex-page-header',
  imports: [],
  templateUrl: './syllex-page-header.html',
  styleUrl: './syllex-page-header.scss',
})
export class SyllexPageHeader {
@Input() title: string = '';
@Input() description: string = '';
}
