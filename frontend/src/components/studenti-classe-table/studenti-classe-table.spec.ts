import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentiClasseTable } from './studenti-classe-table';

describe('StudentiClasseTable', () => {
  let component: StudentiClasseTable;
  let fixture: ComponentFixture<StudentiClasseTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentiClasseTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentiClasseTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
