import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClasseDettaglio } from './classe-dettaglio';

describe('ClasseDettaglio', () => {
  let component: ClasseDettaglio;
  let fixture: ComponentFixture<ClasseDettaglio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClasseDettaglio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClasseDettaglio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
