import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoryRequest,
  CategoryResponse,
  PieceRequest,
  PieceResponse,
  PieceSetRequest,
  PieceSetResponse,
} from '../../core/models/catalog.model';
import { StockAdjustmentRequest, StockAdjustmentResponse } from '../../core/models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly http = inject(HttpClient);

  createCategory(request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(`${environment.apiUrl}/api/catalog/categories`, request);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/catalog/categories/${id}`);
  }

  createPiece(request: PieceRequest): Observable<PieceResponse> {
    return this.http.post<PieceResponse>(`${environment.apiUrl}/api/catalog/pieces`, request);
  }

  updatePiece(id: string, request: PieceRequest): Observable<PieceResponse> {
    return this.http.put<PieceResponse>(`${environment.apiUrl}/api/catalog/pieces/${id}`, request);
  }

  deletePiece(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/catalog/pieces/${id}`);
  }

  adjustStock(pieceId: string, request: StockAdjustmentRequest): Observable<StockAdjustmentResponse> {
    return this.http.post<StockAdjustmentResponse>(
      `${environment.apiUrl}/api/admin/pieces/${pieceId}/stock-adjustment`,
      request
    );
  }

  createSet(request: PieceSetRequest): Observable<PieceSetResponse> {
    return this.http.post<PieceSetResponse>(`${environment.apiUrl}/api/catalog/sets`, request);
  }

  updateSet(id: string, request: PieceSetRequest): Observable<PieceSetResponse> {
    return this.http.put<PieceSetResponse>(`${environment.apiUrl}/api/catalog/sets/${id}`, request);
  }

  deleteSet(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/catalog/sets/${id}`);
  }
}
