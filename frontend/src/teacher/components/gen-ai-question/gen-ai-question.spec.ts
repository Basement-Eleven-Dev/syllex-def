import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenAiQuestion } from './gen-ai-question';

describe('GenAiQuestion', () => {
  let component: GenAiQuestion;
  let fixture: ComponentFixture<GenAiQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenAiQuestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenAiQuestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
