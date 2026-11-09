import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddOrderItemRequest, OrderResponse, UpdateOrderItemRequest } from '../../core/models/order.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  readonly cart = signal<OrderResponse | null>(null);
  readonly itemCount = computed(
    () => this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  );

  loadCart(): Observable<OrderResponse> {
    return this.http
      .post<OrderResponse>(`${environment.apiUrl}/api/orders/me`, null)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  addItem(request: AddOrderItemRequest): Observable<OrderResponse> {
    return this.http
      .post<OrderResponse>(`${environment.apiUrl}/api/orders/me/items`, request)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  updateItemQuantity(itemId: string, request: UpdateOrderItemRequest): Observable<OrderResponse> {
    return this.http
      .put<OrderResponse>(`${environment.apiUrl}/api/orders/me/items/${itemId}`, request)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  removeItem(itemId: string): Observable<OrderResponse> {
    return this.http
      .delete<OrderResponse>(`${environment.apiUrl}/api/orders/me/items/${itemId}`)
      .pipe(tap((cart) => this.cart.set(cart)));
  }
}
