import { Component, Input } from '@angular/core';
import { SyllexButton } from '../syllex-button/syllex-button';

export interface KpiCardData {
  label: string;
  value: number | string;
  requirePercentage?: boolean;
  buttonLabel?: string;
  buttonLink?: string | string[];
  buttonQueryParams?: Record<string, string>;
  bgColor?: string;
  textColor?: string;
}

@Component({
  selector: 'app-syllex-kpi-row',
  imports: [SyllexButton],
  templateUrl: './syllex-kpi-row.html',
  styleUrl: './syllex-kpi-row.scss',
})
export class SyllexKpiRow {
  @Input() kpis: KpiCardData[] = [];
  @Input() colClass: string = 'col-12 col-sm-6 col-xl-3';
}
