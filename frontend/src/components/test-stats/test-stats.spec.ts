import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStats } from './test-stats';

describe('TestStats', () => {
  let component: TestStats;
  let fixture: ComponentFixture<TestStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestStats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
