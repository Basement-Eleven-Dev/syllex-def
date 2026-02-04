import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialeCard } from './materiale-card';

describe('MaterialeCard', () => {
  let component: MaterialeCard;
  let fixture: ComponentFixture<MaterialeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialeCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialeCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
