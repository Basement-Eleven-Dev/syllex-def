import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionTypeSelectors } from './question-type-selectors';

describe('QuestionTypeSelectors', () => {
  let component: QuestionTypeSelectors;
  let fixture: ComponentFixture<QuestionTypeSelectors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionTypeSelectors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionTypeSelectors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
