import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialiSelector } from './materiali-selector';

describe('MaterialiSelector', () => {
  let component: MaterialiSelector;
  let fixture: ComponentFixture<MaterialiSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialiSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialiSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
