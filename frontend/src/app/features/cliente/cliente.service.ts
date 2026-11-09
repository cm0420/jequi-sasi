import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddressRequest, AddressResponse, CustomerResponse } from '../../core/models/customer.model';

export interface CustomerUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${environment.apiUrl}/api/customers/me`);
  }

  updateProfile(request: CustomerUpdateRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${environment.apiUrl}/api/customers/me`, request);
  }

  listAddresses(): Observable<AddressResponse[]> {
    return this.http.get<AddressResponse[]>(`${environment.apiUrl}/api/customers/me/addresses`);
  }

  createAddress(request: AddressRequest): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(`${environment.apiUrl}/api/customers/me/addresses`, request);
  }

  deleteAddress(addressId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/customers/me/addresses/${addressId}`);
  }
}
