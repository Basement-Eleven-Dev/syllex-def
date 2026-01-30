import { TestBed } from '@angular/core/testing';

import { ClassiService } from './classi-service';

describe('ClassiService', () => {
  let service: ClassiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
