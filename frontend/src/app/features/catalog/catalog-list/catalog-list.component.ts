import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../catalog.service';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { PieceResponse } from '../../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SiteHeaderComponent],
  templateUrl: './catalog-list.component.html',
})
export class CatalogListComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  private static readonly PAGE_SIZE = 12;

  readonly pieces = signal<PieceResponse[]>([]);
  readonly loading = signal(true);

  // Seções da home, derivadas das peças já carregadas (sem flag de "recomendado" no backend).
  readonly heroPieces = computed(() => this.pieces().filter((p) => p.imageUrls.length > 0).slice(0, 3));
  readonly recommended = computed(() => this.pieces().filter((p) => p.inStock).slice(0, 4));
  readonly featured = computed(() =>
    this.pieces().filter((p) => p.imageUrls.length > 0 && !!p.description).slice(0, 2),
  );

  ngOnInit(): void {
    this.catalogService.listPieces(0, CatalogListComponent.PAGE_SIZE).subscribe((result) => {
      this.pieces.set(result.content);
      this.loading.set(false);
    });
  }
}
