import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nav',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  get now(): number {
    return Date.now();
  }
}
