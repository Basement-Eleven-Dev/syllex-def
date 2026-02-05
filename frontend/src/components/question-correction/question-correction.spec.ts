import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionCorrection } from './question-correction';

describe('QuestionCorrection', () => {
  let component: QuestionCorrection;
  let fixture: ComponentFixture<QuestionCorrection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCorrection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionCorrection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
