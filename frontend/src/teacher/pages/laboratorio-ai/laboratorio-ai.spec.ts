import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratorioAi } from './laboratorio-ai';

describe('LaboratorioAi', () => {
  let component: LaboratorioAi;
  let fixture: ComponentFixture<LaboratorioAi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaboratorioAi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaboratorioAi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
