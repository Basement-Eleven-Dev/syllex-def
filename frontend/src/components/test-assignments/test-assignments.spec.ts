import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestAssignments } from './test-assignments';

describe('TestAssignments', () => {
  let component: TestAssignments;
  let fixture: ComponentFixture<TestAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestAssignments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
