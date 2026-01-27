import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Banca } from './banca';

describe('Banca', () => {
  let component: Banca;
  let fixture: ComponentFixture<Banca>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Banca]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Banca);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
