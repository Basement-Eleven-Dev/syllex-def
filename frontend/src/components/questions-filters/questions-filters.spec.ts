import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsFilters } from './questions-filters';

describe('QuestionsFilters', () => {
  let component: QuestionsFilters;
  let fixture: ComponentFixture<QuestionsFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
