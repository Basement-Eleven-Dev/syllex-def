import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Correzione } from './correzione';

describe('Correzione', () => {
  let component: Correzione;
  let fixture: ComponentFixture<Correzione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Correzione]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Correzione);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
