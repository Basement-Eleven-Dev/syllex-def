import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComunicazioniList } from './comunicazioni-list';

describe('ComunicazioniList', () => {
  let component: ComunicazioniList;
  let fixture: ComponentFixture<ComunicazioniList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunicazioniList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComunicazioniList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
