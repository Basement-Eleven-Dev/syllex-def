import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comunicazioni } from './comunicazioni';

describe('Comunicazioni', () => {
  let component: Comunicazioni;
  let fixture: ComponentFixture<Comunicazioni>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comunicazioni]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Comunicazioni);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
