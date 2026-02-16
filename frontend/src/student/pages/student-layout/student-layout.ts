import { Component } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-student-layout',
  imports: [Nav, RouterOutlet],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.scss',
})
export class StudentLayout {}
