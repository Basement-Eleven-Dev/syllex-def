import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { SyllexButton } from '../syllex-button/syllex-button';

@Component({
  selector: 'app-syllex-banner',
  standalone: true,
  imports: [CommonModule, SyllexButton],
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
