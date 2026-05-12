import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-syllex-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './syllex-banner.html',
  styleUrl: './syllex-banner.scss',
})
export class SyllexBanner {
  @Input() title!: SafeHtml;
  @Input() description!: string;
  @Input() buttonText: string = 'Scopri di più';
  @Input() buttonLink!: string;
  @Input() bgClass: string = 'bg-primary-gradient';
  @Input() bgImage?: string;
  @Input() bgSize: string = 'cover';
  @Input() bgPosition: string = 'center';
}
