import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditComunicazione } from './create-edit-comunicazione';

describe('CreateEditComunicazione', () => {
  let component: CreateEditComunicazione;
  let fixture: ComponentFixture<CreateEditComunicazione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditComunicazione]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditComunicazione);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
