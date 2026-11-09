import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryResponse, PieceResponse, PieceSetResponse } from '../../core/models/catalog.model';
import { Page } from '../../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  listPieces(page: number, size: number, categoryId?: string): Observable<Page<PieceResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    return this.http.get<Page<PieceResponse>>(`${environment.apiUrl}/api/catalog/pieces`, { params });
  }

  getPiece(id: string): Observable<PieceResponse> {
    return this.http.get<PieceResponse>(`${environment.apiUrl}/api/catalog/pieces/${id}`);
  }

  listSets(page: number, size: number): Observable<Page<PieceSetResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<PieceSetResponse>>(`${environment.apiUrl}/api/catalog/sets`, { params });
  }

  getSet(id: string): Observable<PieceSetResponse> {
    return this.http.get<PieceSetResponse>(`${environment.apiUrl}/api/catalog/sets/${id}`);
  }

  listCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${environment.apiUrl}/api/catalog/categories`);
  }
}
