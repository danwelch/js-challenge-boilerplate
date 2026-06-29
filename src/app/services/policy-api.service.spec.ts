import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { POLICY_API_URL, PolicyApiService } from './policy-api.service';

const TEST_URL = 'https://test.example.com/posts';

describe('PolicyApiService', () => {
  let service: PolicyApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: POLICY_API_URL, useValue: TEST_URL },
      ],
    });
    service = TestBed.inject(PolicyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POSTs to the configured URL with the policies body and resolves with the id', async () => {
    const policies = [{ policyNumber: '457508000', valid: true }];
    const promise = service.submit(policies);

    const req = httpMock.expectOne(TEST_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ policies });
    req.flush({ id: 101 });

    const result = await promise;
    expect(result).toEqual({ id: 101 });
  });

  it('rejects when the server returns an error', async () => {
    const promise = service.submit([]);

    const req = httpMock.expectOne(TEST_URL);
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    await expect(promise).rejects.toThrow();
  });
});
