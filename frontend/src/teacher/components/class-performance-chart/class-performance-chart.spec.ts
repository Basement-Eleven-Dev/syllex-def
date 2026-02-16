import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassPerformanceChart } from './class-performance-chart';

describe('ClassPerformanceChart', () => {
  let component: ClassPerformanceChart;
  let fixture: ComponentFixture<ClassPerformanceChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassPerformanceChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassPerformanceChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
