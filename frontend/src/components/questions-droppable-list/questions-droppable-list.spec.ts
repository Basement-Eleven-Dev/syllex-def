import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsDroppableList } from './questions-droppable-list';

describe('QuestionsDroppableList', () => {
  let component: QuestionsDroppableList;
  let fixture: ComponentFixture<QuestionsDroppableList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsDroppableList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsDroppableList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
