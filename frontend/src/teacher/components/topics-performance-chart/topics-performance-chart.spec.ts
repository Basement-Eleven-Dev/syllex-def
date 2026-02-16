import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicsPerformanceChart } from './topics-performance-chart';

describe('TopicsPerformanceChart', () => {
  let component: TopicsPerformanceChart;
  let fixture: ComponentFixture<TopicsPerformanceChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicsPerformanceChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicsPerformanceChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
