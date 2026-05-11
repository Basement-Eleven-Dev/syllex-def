import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-syllex-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './syllex-banner.html',
  styleUrl: './syllex-banner.scss',
})
export class SyllexBanner {
  @Input() title!: string;
  @Input() description!: string;
  @Input() buttonText: string = 'Scopri di più';
  @Input() buttonLink!: string;
  @Input() bgClass: string = 'bg-primary-gradient';
  @Input() bgImage?: string;
  @Input() bgSize: string = 'cover';
  @Input() bgPosition: string = 'center';
}
