import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserCreateRequest, UserResponse, UserRole } from '../../core/models/admin.model';
import { Page } from '../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/users`;

  list(page: number, size: number, role: UserRole | null): Observable<Page<UserResponse>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    if (role) params = params.set('role', role);
    return this.http.get<Page<UserResponse>>(this.base, { params });
  }

  create(request: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.base, request);
  }

  updateRole(id: string, role: UserRole): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/${encodeURIComponent(id)}/role`, { role });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
