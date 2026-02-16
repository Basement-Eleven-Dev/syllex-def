import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface StatCardData {
  Label: string;
  Value: number;
  RequirePercentage?: boolean;
  Link?: string | string[];
  QueryParams?: { [key: string]: string };
  LinkLabel?: string;
}

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  stat = input.required<StatCardData>();
}
