import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestContextualMenu } from './test-contextual-menu';

describe('TestContextualMenu', () => {
  let component: TestContextualMenu;
  let fixture: ComponentFixture<TestContextualMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestContextualMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestContextualMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
