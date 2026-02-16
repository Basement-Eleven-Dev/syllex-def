import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditTest } from './create-edit-test';

describe('CreateEditTest', () => {
  let component: CreateEditTest;
  let fixture: ComponentFixture<CreateEditTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
