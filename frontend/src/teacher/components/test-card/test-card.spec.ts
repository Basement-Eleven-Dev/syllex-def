import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestCard } from './test-card';

describe('TestCard', () => {
  let component: TestCard;
  let fixture: ComponentFixture<TestCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
