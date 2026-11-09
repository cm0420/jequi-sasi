import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminOrdersService } from '../../admin-orders.service';
import { ORDER_STATUS_LABEL, OrderResponse, OrderStatus } from '../../../../core/models/order.model';

const PAGE_SIZE = 15;

const STATUS_FILTERS: (OrderStatus | null)[] = [
  null,
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'ENVIADO',
  'ENTREGUE',
  'ESTORNO_SOLICITADO',
  'ESTORNADO',
  'CANCELADO',
  'EXPIRADO',
];

@Component({
  selector: 'app-admin-order-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './admin-order-list.component.html',
})
export class AdminOrderListComponent implements OnInit {
  private readonly adminOrdersService = inject(AdminOrdersService);

  readonly statusLabel = ORDER_STATUS_LABEL;
  readonly statusFilters = STATUS_FILTERS;

  readonly selectedStatus = signal<OrderStatus | null>(null);
  readonly orders = signal<OrderResponse[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(true);

  readonly hasPrev = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());

  ngOnInit(): void {
    this.loadOrders();
  }

  selectStatus(status: OrderStatus | null): void {
    if (this.selectedStatus() === status) return;
    this.selectedStatus.set(status);
    this.page.set(0);
    this.loadOrders();
  }

  goToPage(delta: number): void {
    this.page.update((current) => current + delta);
    this.loadOrders();
  }

  pillClass(active: boolean): string {
    const base = 'font-body text-sm font-medium px-4 py-2 rounded-full border transition-colors';
    return active
      ? `${base} bg-forest text-canvas border-forest`
      : `${base} bg-surface text-ink border-hairline hover:border-forest hover:text-forest`;
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
    this.adminOrdersService
      .listAllOrders(this.page(), PAGE_SIZE, this.selectedStatus() ?? undefined)
      .subscribe((result) => {
        this.orders.set(result.content);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      });
  }
}
