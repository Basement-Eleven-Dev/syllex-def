import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alex-mascot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alex-mascot.html',
  styleUrl: './alex-mascot.scss'
})
export class AlexMascot {
  @Input() variant: 'student' | 'teacher' = 'student';
}
