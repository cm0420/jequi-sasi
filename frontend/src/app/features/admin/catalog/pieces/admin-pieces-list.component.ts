import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../catalog/catalog.service';
import { AdminCatalogService } from '../../admin-catalog.service';
import { PieceResponse } from '../../../../core/models/catalog.model';
import { ApiError } from '../../../../core/models/api-error.model';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-admin-pieces-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './admin-pieces-list.component.html',
})
export class AdminPiecesListComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly adminCatalogService = inject(AdminCatalogService);

  readonly pieces = signal<PieceResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly adjustingId = signal<string | null>(null);
  readonly adjustDelta = signal<number>(0);
  readonly adjustReason = signal('');
  readonly adjustSubmitting = signal(false);

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  ngOnInit(): void {
    this.loadPieces();
  }

  goToPage(delta: number): void {
    this.page.update((current) => current + delta);
    this.loadPieces();
  }

  deletePiece(piece: PieceResponse): void {
    if (!confirm('Excluir esta peça? Essa ação não pode ser desfeita.')) return;
    this.deletingId.set(piece.id);
    this.adminCatalogService.deletePiece(piece.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.pieces.update((current) => current.filter((p) => p.id !== piece.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível excluir a peça.');
      },
    });
  }

  toggleAdjust(piece: PieceResponse): void {
    if (this.adjustingId() === piece.id) {
      this.adjustingId.set(null);
      return;
    }
    this.adjustingId.set(piece.id);
    this.adjustDelta.set(0);
    this.adjustReason.set('');
  }

  submitAdjust(piece: PieceResponse): void {
    if (this.adjustDelta() === 0 || this.adjustReason().trim().length === 0) return;

    this.adjustSubmitting.set(true);
    this.errorMessage.set(null);
    this.adminCatalogService
      .adjustStock(piece.id, { delta: this.adjustDelta(), reason: this.adjustReason().trim() })
      .subscribe({
        next: (result) => {
          this.adjustSubmitting.set(false);
          this.adjustingId.set(null);
          this.pieces.update((current) =>
            current.map((p) =>
              p.id === piece.id ? { ...p, stock: result.newStock, inStock: result.newStock > 0 } : p
            )
          );
        },
        error: (err: HttpErrorResponse) => {
          this.adjustSubmitting.set(false);
          const apiError = err.error as ApiError | undefined;
          this.errorMessage.set(apiError?.message ?? 'Não foi possível ajustar o estoque.');
        },
      });
  }

  private loadPieces(): void {
    this.loading.set(true);
    this.catalogService.listPieces(this.page(), PAGE_SIZE).subscribe((result) => {
      this.pieces.set(result.content);
      this.totalPages.set(result.totalPages);
      this.loading.set(false);
    });
  }
}
