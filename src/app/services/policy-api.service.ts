import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { PolicyRecord } from '../models/policy.model';

export const POLICY_API_URL = new InjectionToken<string>('POLICY_API_URL', {
  providedIn: 'root',
  factory: () => 'https://jsonplaceholder.typicode.com/posts',
});

@Injectable({ providedIn: 'root' })
export class PolicyApiService {
  private readonly http = inject(HttpClient);
  private readonly url = inject(POLICY_API_URL);

  submit(policies: PolicyRecord[]): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>(this.url, { policies }));
  }
}
