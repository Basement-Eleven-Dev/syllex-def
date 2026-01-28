import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleChoiceOptions } from './multiple-choice-options';

describe('MultipleChoiceOptions', () => {
  let component: MultipleChoiceOptions;
  let fixture: ComponentFixture<MultipleChoiceOptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleChoiceOptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleChoiceOptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
