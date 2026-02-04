import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenAiQuestions } from './gen-ai-questions';

describe('GenAiQuestions', () => {
  let component: GenAiQuestions;
  let fixture: ComponentFixture<GenAiQuestions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenAiQuestions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenAiQuestions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
