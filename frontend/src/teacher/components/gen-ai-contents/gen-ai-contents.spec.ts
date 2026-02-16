import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenAiContents } from './gen-ai-contents';

describe('GenAiContents', () => {
  let component: GenAiContents;
  let fixture: ComponentFixture<GenAiContents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenAiContents],
    }).compileComponents();

    fixture = TestBed.createComponent(GenAiContents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
