import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FontAwesomeModule,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';
import { faPaperclip, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { Calendario } from '../../components/calendario/calendario';
import { RouterModule } from '@angular/router';
import { Auth } from '../../services/auth';

interface DashboardQuickLink {
  value: number;
  description: string;
  route: string;
  routeString: string;
  alert?: boolean;
}

interface DashboardAction {
  label: string;
  icon: IconDefinition;
  action: () => void;
}

interface Communication {
  title: string;
  body: string;
  date: Date;
  attachmentCount: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [FontAwesomeModule, DatePipe, Calendario, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(public authService: Auth) {}
  AttachmentIcon = faPaperclip;
  quickLinks: DashboardQuickLink[] = [
    {
      value: 42,
      description: 'Classi',
      route: '/classi',
      routeString: 'Vai alle Classi',
    },
    {
      value: 15,
      description: 'Test pubblicati',
      route: '/test-pubblicati',
      routeString: 'Vai ai test pubblicati',
    },
    {
      value: 8,
      description: 'Test da correggere',
      route: '/assignments',
      routeString: 'Vai ai Test da correggere',
      alert: true,
    },
    {
      value: 5,
      description: 'Materiali',
      route: '/materiali',
      routeString: 'Vai ai materiali',
    },
  ];

  quickActions: DashboardAction[] = [
    {
      label: 'Add New Student',
      icon: faPlus,
      action: () => {
        console.log('Add New Student action triggered');
      },
    },
    {
      label: 'Create Course',
      icon: faPlus,
      action: () => {
        console.log('Create Course action triggered');
      },
    },
    {
      label: 'Schedule Exam',
      icon: faPlus,
      action: () => {
        console.log('Schedule Exam action triggered');
      },
    },
    {
      label: 'Schedule Exam',
      icon: faPlus,
      action: () => {
        console.log('Schedule Exam action triggered');
      },
    },
  ];

  communications: Communication[] = [
    {
      title: 'Parent-Teacher Meeting Scheduled',
      body: 'A parent-teacher meeting has been scheduled for next Friday at 3 PM.',
      date: new Date('2024-06-10T10:00:00'),
      attachmentCount: 2,
    },
    {
      title: 'New Assignment Posted',
      body: 'A new assignment on Algebra has been posted for Class 10 students.',
      date: new Date('2024-06-09T14:30:00'),
      attachmentCount: 0,
    },
    {
      title: 'School Annual Day',
      body: 'The school annual day is scheduled for 20th June. All students are encouraged to participate.',
      date: new Date('2024-06-08T09:15:00'),
      attachmentCount: 1,
    },
    {
      title: 'School Annual Day',
      body: 'The school annual day is scheduled for 20th June. All students are encouraged to participate.',
      date: new Date('2024-06-08T09:15:00'),
      attachmentCount: 1,
    },
  ];
}
