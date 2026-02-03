import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticheClasse } from './statistiche-classe';

describe('StatisticheClasse', () => {
  let component: StatisticheClasse;
  let fixture: ComponentFixture<StatisticheClasse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticheClasse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticheClasse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
