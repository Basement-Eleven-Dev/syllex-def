import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackTo } from './back-to';

describe('BackTo', () => {
  let component: BackTo;
  let fixture: ComponentFixture<BackTo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackTo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackTo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
