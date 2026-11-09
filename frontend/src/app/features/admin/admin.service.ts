import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BestSellingPieceResponse,
  DailySalesResponse,
  OrderStatusCountResponse,
  SalesReportResponse,
} from '../../core/models/admin.model';
import { OrderResponse } from '../../core/models/order.model';
import { Page } from '../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getSalesReport(startDate: string, endDate: string): Observable<SalesReportResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<SalesReportResponse>(`${environment.apiUrl}/api/admin/reports/sales`, { params });
  }

  getDailySales(startDate: string, endDate: string): Observable<DailySalesResponse[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<DailySalesResponse[]>(`${environment.apiUrl}/api/admin/reports/sales-daily`, { params });
  }

  getOrdersByStatus(): Observable<OrderStatusCountResponse[]> {
    return this.http.get<OrderStatusCountResponse[]>(`${environment.apiUrl}/api/admin/reports/orders-by-status`);
  }

  getBestSellingPieces(limit: number): Observable<BestSellingPieceResponse[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<BestSellingPieceResponse[]>(
      `${environment.apiUrl}/api/admin/reports/best-selling-pieces`,
      { params }
    );
  }

  getPendingShipmentOrders(page: number, size: number): Observable<Page<OrderResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<OrderResponse>>(`${environment.apiUrl}/api/admin/reports/pending-shipment`, {
      params,
    });
  }
}
