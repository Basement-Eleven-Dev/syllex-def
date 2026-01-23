import { Component } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-teacher-layout',
  imports: [Nav, Sidebar, RouterOutlet],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
})
export class TeacherLayout {}
