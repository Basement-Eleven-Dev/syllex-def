import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Materiali } from './materiali';

describe('Materiali', () => {
  let component: Materiali;
  let fixture: ComponentFixture<Materiali>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Materiali]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Materiali);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
