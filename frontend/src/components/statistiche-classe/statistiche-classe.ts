import { Component } from '@angular/core';
import { TopicsPerformanceChart } from '../topics-performance-chart/topics-performance-chart';
import { ClassPerformanceChart } from '../class-performance-chart/class-performance-chart';
@Component({
  selector: 'app-statistiche-classe',
  imports: [TopicsPerformanceChart, ClassPerformanceChart],
  templateUrl: './statistiche-classe.html',
  styleUrl: './statistiche-classe.scss',
})
export class StatisticheClasse {}
