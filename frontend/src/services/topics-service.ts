import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TopicsService {
  topics: string[] = [
    'Matematica',
    'Scienze',
    'Storia',
    'Geografia',
    'Letteratura',
    'Informatica',
  ];
}
