import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenAiMaterials } from './gen-ai-materials';

describe('GenAiMaterials', () => {
  let component: GenAiMaterials;
  let fixture: ComponentFixture<GenAiMaterials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenAiMaterials]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenAiMaterials);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
