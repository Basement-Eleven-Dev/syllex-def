import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Classi } from './classi';

describe('Classi', () => {
  let component: Classi;
  let fixture: ComponentFixture<Classi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Classi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Classi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
