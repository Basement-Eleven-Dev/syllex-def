import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchQuestions } from './search-questions';

describe('SearchQuestions', () => {
  let component: SearchQuestions;
  let fixture: ComponentFixture<SearchQuestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchQuestions],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchQuestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
