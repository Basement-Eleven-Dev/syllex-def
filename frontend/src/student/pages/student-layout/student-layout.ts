import { Component } from '@angular/core';
import { Nav } from '../../components/nav/nav';
import { RouterOutlet } from '@angular/router';
import { HelpChat } from '../../../teacher/components/help-chat/help-chat';

@Component({
  selector: 'app-student-layout',
  imports: [Nav, RouterOutlet, HelpChat],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.scss',
})
export class StudentLayout {}
