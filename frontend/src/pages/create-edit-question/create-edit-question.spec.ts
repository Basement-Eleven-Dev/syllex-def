import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditQuestion } from './create-edit-question';

describe('CreateEditQuestion', () => {
  let component: CreateEditQuestion;
  let fixture: ComponentFixture<CreateEditQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditQuestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditQuestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
