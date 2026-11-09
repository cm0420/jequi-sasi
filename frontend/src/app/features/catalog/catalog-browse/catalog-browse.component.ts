import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../catalog.service';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { CategoryResponse, PieceResponse, PieceSetResponse } from '../../../core/models/catalog.model';

const SEARCH_PAGE_SIZE = 100;
const SETS_PAGE_SIZE = 12;

type CatalogView = 'pecas' | 'conjuntos';
type SortOption = 'relevancia' | 'preco-asc' | 'preco-desc' | 'nome';

@Component({
  selector: 'app-catalog-browse',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SiteHeaderComponent],
  templateUrl: './catalog-browse.component.html',
})
export class CatalogBrowseComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  private static readonly PAGE_SIZE = 12;

  readonly view = signal<CatalogView>('pecas');

  readonly categories = signal<CategoryResponse[]>([]);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly pieces = signal<PieceResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);

  readonly searchQuery = signal('');
  readonly searchResults = signal<PieceResponse[] | null>(null);
  readonly isSearching = computed(() => this.searchQuery().trim().length > 0);
  readonly filteredSearchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return (this.searchResults() ?? []).filter((piece) => piece.name.toLowerCase().includes(query));
  });

  readonly sortBy = signal<SortOption>('relevancia');
  readonly displayedPieces = computed(() => {
    const base = this.isSearching() ? this.filteredSearchResults() : this.pieces();
    return this.sortPieces(base);
  });

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  readonly sets = signal<PieceSetResponse[]>([]);
  readonly setsPage = signal(0);
  readonly setsTotalPages = signal(0);
  readonly setsLoading = signal(true);
  private setsLoaded = false;

  readonly setsHasPrev = computed(() => this.setsPage() > 0);
  readonly setsHasNext = computed(() => this.setsPage() + 1 < this.setsTotalPages());

  ngOnInit(): void {
    this.catalogService.listCategories().subscribe((categories) => this.categories.set(categories));
    this.loadPieces();
    // Busca vinda do header: /catalogo?q=... (assina pra reagir mesmo já estando na página).
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') ?? '';
      this.searchQuery.set(q);
      if (q.trim().length > 0 && this.searchResults() === null) {
        this.loadSearchPool();
      }
    });
  }

  switchView(view: CatalogView): void {
    this.view.set(view);
    if (view === 'conjuntos' && !this.setsLoaded) {
      this.setsLoaded = true;
      this.loadSets();
    }
  }

  goToSetsPage(delta: number): void {
    this.setsPage.update((current) => current + delta);
    this.loadSets();
  }

  private loadSets(): void {
    this.setsLoading.set(true);
    this.catalogService.listSets(this.setsPage(), SETS_PAGE_SIZE).subscribe((result) => {
      this.sets.set(result.content);
      this.setsTotalPages.set(result.totalPages);
      this.setsLoading.set(false);
    });
  }

  selectCategory(categoryId: string | null): void {
    if (this.selectedCategoryId() === categoryId) {
      return;
    }
    this.selectedCategoryId.set(categoryId);
    this.page.set(0);
    this.loadPieces();
    if (this.isSearching()) {
      this.loadSearchPool();
    }
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    if (query.trim().length > 0 && this.searchResults() === null) {
      this.loadSearchPool();
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  setSort(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  // shortcut: ordena só as peças já carregadas (página atual / pool de busca). O catálogo cabe numa página hoje; quando passar de uma, ordenar no backend via Pageable sort.
  private sortPieces(list: PieceResponse[]): PieceResponse[] {
    const by = this.sortBy();
    if (by === 'relevancia') return list;
    const copy = [...list];
    if (by === 'preco-asc') return copy.sort((a, b) => a.price - b.price);
    if (by === 'preco-desc') return copy.sort((a, b) => b.price - a.price);
    return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  goToPage(delta: number): void {
    this.page.update((current) => current + delta);
    this.loadPieces();
  }

  private loadPieces(): void {
    this.loading.set(true);
    this.catalogService
      .listPieces(this.page(), CatalogBrowseComponent.PAGE_SIZE, this.selectedCategoryId() ?? undefined)
      .subscribe((result) => {
        this.pieces.set(result.content);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      });
  }

  private loadSearchPool(): void {
    this.catalogService
      .listPieces(0, SEARCH_PAGE_SIZE, this.selectedCategoryId() ?? undefined)
      .subscribe((result) => this.searchResults.set(result.content));
  }
}
