import { TestBed } from '@angular/core/testing';

import { Questions } from './questions';

describe('Questions', () => {
  let service: Questions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Questions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
