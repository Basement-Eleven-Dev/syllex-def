import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsSearchFilters } from './questions-search-filters';

describe('QuestionsSearchFilters', () => {
  let component: QuestionsSearchFilters;
  let fixture: ComponentFixture<QuestionsSearchFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsSearchFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsSearchFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
