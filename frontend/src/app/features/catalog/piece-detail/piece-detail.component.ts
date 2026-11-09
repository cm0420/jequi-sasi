import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../catalog.service';
import { PieceResponse } from '../../../core/models/catalog.model';
import { ApiError } from '../../../core/models/api-error.model';
import { AuthService } from '../../auth/auth.service';
import { CartService } from '../../cart/cart.service';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';

@Component({
  selector: 'app-piece-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SiteHeaderComponent, BackLinkComponent],
  templateUrl: './piece-detail.component.html',
})
export class PieceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly piece = signal<PieceResponse | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly quantity = signal(1);
  readonly addingToCart = signal(false);
  readonly justAdded = signal(false);
  readonly addToCartError = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.catalogService.getPiece(id).subscribe({
      next: (piece) => {
        this.piece.set(piece);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  incrementQuantity(): void {
    const stock = this.piece()?.stock ?? 1;
    this.quantity.update((current) => Math.min(current + 1, stock));
  }

  decrementQuantity(): void {
    this.quantity.update((current) => Math.max(current - 1, 1));
  }

  addToCart(pieceId: string): void {
    this.addingToCart.set(true);
    this.addToCartError.set(null);
    this.justAdded.set(false);

    this.cartService.addItem({ pieceId, quantity: this.quantity() }).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.justAdded.set(true);
        this.quantity.set(1);
      },
      error: (err: HttpErrorResponse) => {
        this.addingToCart.set(false);
        const apiError = err.error as ApiError | undefined;
        this.addToCartError.set(apiError?.message ?? 'Não foi possível adicionar ao carrinho.');
      },
    });
  }
}
