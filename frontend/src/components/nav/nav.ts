import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav',
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav implements OnInit, OnDestroy {
  now: number = Date.now();
  private intervalId?: number;

  ngOnInit() {
    this.intervalId = window.setInterval(() => {
      this.now = Date.now();
    }, 60000); // Update every minute
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
