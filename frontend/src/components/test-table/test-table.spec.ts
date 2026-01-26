import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTable } from './test-table';

describe('TestTable', () => {
  let component: TestTable;
  let fixture: ComponentFixture<TestTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
