import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartLine, faChartPie } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FontAwesomeModule],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.scss',
})
export class AdminAnalyticsComponent implements OnInit {
  @Input() stats: any;

  icons = {
    faChartLine,
    faChartPie
  };

  // Activity Chart
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Media Punteggi (%)',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(52, 152, 219, 1)',
        fill: 'origin',
        tension: 0.4
      }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Media: ${context.parsed?.y?.toFixed(1) || 0}%`
        }
      }
    },
    scales: {
      y: { 
        min: 0, 
        max: 100,
        ticks: { callback: (value) => `${value}%` }
      },
      x: { grid: { display: false } }
    }
  };

  // Role Distribution Chart
  public doughnutChartLabels: string[] = ['Admin', 'Docenti', 'Studenti'];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      { 
        data: [],
        backgroundColor: ['#3498db', '#2ecc71', '#f1c40f'],
        hoverBackgroundColor: ['#2980b9', '#27ae60', '#f39c12'],
        borderWidth: 0
      }
    ]
  };
  
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };

  ngOnInit() {
    if (this.stats) {
        // 1. Role Distribution
        const roles = this.stats.roleDistribution || {};
        this.doughnutChartData = {
            labels: ['Admin', 'Docenti', 'Studenti'],
            datasets: [{
                data: [
                    roles.admin || 0,
                    roles.teacher || 0,
                    roles.student || 0
                ],
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f'],
                hoverBackgroundColor: ['#2980b9', '#27ae60', '#f39c12'],
                borderWidth: 0
            }]
        };

        // 2. Performance Trend
        if (this.stats.performanceTrend && this.stats.performanceTrend.length > 0) {
            this.lineChartData = {
                labels: this.stats.performanceTrend.map((t: any) => {
                    const date = new Date(t._id);
                    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
                }),
                datasets: [{
                    ...this.lineChartData.datasets[0],
                    label: 'Media Punteggi (%)',
                    data: this.stats.performanceTrend.map((t: any) => t.avgScore)
                }]
            };
        }
    }
  }
}
