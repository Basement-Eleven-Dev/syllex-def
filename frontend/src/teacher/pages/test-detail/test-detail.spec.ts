import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestDetail } from './test-detail';

describe('TestDetail', () => {
  let component: TestDetail;
  let fixture: ComponentFixture<TestDetail>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
