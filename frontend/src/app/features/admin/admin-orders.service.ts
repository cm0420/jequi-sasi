import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOrderDetailResponse } from '../../core/models/admin.model';
import { OrderResponse, OrderStatus } from '../../core/models/order.model';
import { Page } from '../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);

  listAllOrders(page: number, size: number, status?: OrderStatus): Observable<Page<OrderResponse>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Page<OrderResponse>>(`${environment.apiUrl}/api/orders`, { params });
  }

  getOrderDetail(orderId: string): Observable<AdminOrderDetailResponse> {
    return this.http.get<AdminOrderDetailResponse>(`${environment.apiUrl}/api/admin/orders/${orderId}`);
  }

  markAsPaid(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/${orderId}/mark-paid`, null);
  }

  ship(orderId: string, trackingCode: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/${orderId}/ship`, { trackingCode });
  }

  deliver(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/${orderId}/deliver`, null);
  }

  cancel(orderId: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/api/orders/${orderId}/cancel`, null);
  }

  approveRefund(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/${orderId}/refund-approve`, null);
  }

  denyRefund(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/${orderId}/refund-deny`, null);
  }
}
