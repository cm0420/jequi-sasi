import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderResponse } from '../../core/models/order.model';
import { ShippingQuoteResponse } from '../../core/models/shipping.model';
import { InitiatePaymentRequest, PaymentResponse } from '../../core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  getOrder(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${environment.apiUrl}/api/orders/me/${orderId}`);
  }

  checkout(addressId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/me/checkout`, { addressId });
  }

  getShippingQuotes(orderId: string): Observable<ShippingQuoteResponse[]> {
    return this.http.get<ShippingQuoteResponse[]>(
      `${environment.apiUrl}/api/orders/me/${orderId}/shipping/quotes`
    );
  }

  selectShipping(orderId: string, code: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${environment.apiUrl}/api/orders/me/${orderId}/shipping`, { code });
  }

  pay(orderId: string, request?: InitiatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${environment.apiUrl}/api/orders/me/${orderId}/payments`,
      request ?? {}
    );
  }
}
