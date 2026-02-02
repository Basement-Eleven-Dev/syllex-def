import { TestBed } from '@angular/core/testing';

import { MaterialiService } from './materiali-service';

describe('MaterialiService', () => {
  let service: MaterialiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterialiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
