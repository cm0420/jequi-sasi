import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../orders.service';
import { ORDER_STATUS_LABEL, OrderResponse, OrderStatus } from '../../../core/models/order.model';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, SiteHeaderComponent, BackLinkComponent],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly statusLabel = ORDER_STATUS_LABEL;

  readonly orders = signal<OrderResponse[]>([]);
  readonly placedOrders = computed(() => this.orders().filter((o) => o.status !== 'CARRINHO'));
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  ngOnInit(): void {
    this.loadOrders();
  }

  goToPage(delta: number): void {
    this.page.update((current) => current + delta);
    this.loadOrders();
  }

  statusClass(status: OrderStatus): string {
    if (status === 'CANCELADO' || status === 'EXPIRADO' || status === 'ESTORNADO' || status === 'ESTORNO_SOLICITADO') {
      return 'text-clay';
    }
    if (status === 'PAGO' || status === 'ENVIADO' || status === 'ENTREGUE') {
      return 'text-forest';
    }
    return 'text-ink/60';
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.ordersService.listOwnOrders(this.page(), PAGE_SIZE).subscribe((result) => {
      this.orders.set(result.content);
      this.totalPages.set(result.totalPages);
      this.loading.set(false);
    });
  }
}
