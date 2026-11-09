import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse } from '../../core/models/order.model';
import { Page } from '../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  listOwnOrders(page: number, size: number): Observable<Page<OrderResponse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<OrderResponse>>(`${environment.apiUrl}/api/orders/me`, { params });
  }

  getOrder(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${environment.apiUrl}/api/orders/me/${orderId}`);
  }

  cancelOrder(orderId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/orders/me/${orderId}/cancel`, null);
  }

  requestRefund(orderId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/orders/me/${orderId}/refund-request`, { reason });
  }
}
