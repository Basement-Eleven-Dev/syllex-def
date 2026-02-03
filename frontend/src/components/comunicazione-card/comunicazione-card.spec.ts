import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComunicazioneCard } from './comunicazione-card';

describe('ComunicazioneCard', () => {
  let component: ComunicazioneCard;
  let fixture: ComponentFixture<ComunicazioneCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComunicazioneCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComunicazioneCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
