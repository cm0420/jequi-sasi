import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../catalog/catalog.service';
import { AdminCatalogService } from '../../admin-catalog.service';
import { PieceSetResponse } from '../../../../core/models/catalog.model';
import { ApiError } from '../../../../core/models/api-error.model';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-admin-sets-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './admin-sets-list.component.html',
})
export class AdminSetsListComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly adminCatalogService = inject(AdminCatalogService);

  readonly sets = signal<PieceSetResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  ngOnInit(): void {
    this.loadSets();
  }

  goToPage(delta: number): void {
    this.page.update((current) => current + delta);
    this.loadSets();
  }

  deleteSet(set: PieceSetResponse): void {
    if (!confirm('Excluir este conjunto? Essa ação não pode ser desfeita.')) return;
    this.deletingId.set(set.id);
    this.adminCatalogService.deleteSet(set.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.sets.update((current) => current.filter((s) => s.id !== set.id));
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Não foi possível excluir o conjunto.');
      },
    });
  }

  private loadSets(): void {
    this.loading.set(true);
    this.catalogService.listSets(this.page(), PAGE_SIZE).subscribe((result) => {
      this.sets.set(result.content);
      this.totalPages.set(result.totalPages);
      this.loading.set(false);
    });
  }
}
