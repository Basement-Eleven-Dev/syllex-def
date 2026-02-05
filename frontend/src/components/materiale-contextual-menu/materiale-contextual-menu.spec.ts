import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialeContextualMenu } from './materiale-contextual-menu';

describe('MaterialeContextualMenu', () => {
  let component: MaterialeContextualMenu;
  let fixture: ComponentFixture<MaterialeContextualMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialeContextualMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialeContextualMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
