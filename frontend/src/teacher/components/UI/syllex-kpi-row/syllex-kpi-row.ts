import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SyllexButton } from '../syllex-button/syllex-button';

export interface KpiCardData {
  label: string;
  value: number | string;
  requirePercentage?: boolean;
  buttonLabel?: string;
  buttonLink?: string | string[];
  buttonQueryParams?: Record<string, string>;
}

@Component({
  selector: 'app-syllex-kpi-row',
  imports: [RouterLink, SyllexButton],
  templateUrl: './syllex-kpi-row.html',
  styleUrl: './syllex-kpi-row.scss',
})
export class SyllexKpiRow {
  @Input() kpis: KpiCardData[] = [];
}
