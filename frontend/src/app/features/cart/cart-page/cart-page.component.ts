import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../cart.service';
import { OrderItemResponse } from '../../../core/models/order.model';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SiteHeaderComponent, BackLinkComponent],
  templateUrl: './cart-page.component.html',
})
export class CartPageComponent implements OnInit {
  private readonly cartService = inject(CartService);

  readonly cart = this.cartService.cart;
  readonly loading = signal(true);
  readonly updatingItemId = signal<string | null>(null);

  ngOnInit(): void {
    this.cartService.loadCart().subscribe(() => this.loading.set(false));
  }

  incrementQuantity(item: OrderItemResponse): void {
    this.updateQuantity(item, item.quantity + 1);
  }

  decrementQuantity(item: OrderItemResponse): void {
    if (item.quantity <= 1) {
      return;
    }
    this.updateQuantity(item, item.quantity - 1);
  }

  removeItem(item: OrderItemResponse): void {
    this.updatingItemId.set(item.id);
    this.cartService.removeItem(item.id).subscribe(() => this.updatingItemId.set(null));
  }

  private updateQuantity(item: OrderItemResponse, quantity: number): void {
    this.updatingItemId.set(item.id);
    this.cartService
      .updateItemQuantity(item.id, { quantity })
      .subscribe(() => this.updatingItemId.set(null));
  }
}
