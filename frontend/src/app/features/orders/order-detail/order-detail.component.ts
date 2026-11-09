import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from '../orders.service';
import { ORDER_STATUS_LABEL, OrderResponse } from '../../../core/models/order.model';
import { ApiError } from '../../../core/models/api-error.model';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, SiteHeaderComponent, BackLinkComponent],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  readonly statusLabel = ORDER_STATUS_LABEL;

  readonly order = signal<OrderResponse | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionDone = signal<'cancelled' | 'refund-requested' | null>(null);

  readonly showRefundForm = signal(false);
  readonly refundReason = signal('');

  readonly canCancel = computed(
    () => this.order()?.status === 'AGUARDANDO_PAGAMENTO' && !this.actionDone()
  );
  readonly canRequestRefund = computed(() => {
    const status = this.order()?.status;
    return (status === 'PAGO' || status === 'ENVIADO' || status === 'ENTREGUE') && !this.actionDone();
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.fetchOrder(orderId);
  }

  cancelOrder(): void {
    if (!confirm('Cancelar este pedido? As peças voltam para o estoque.')) return;
    const order = this.order();
    if (!order) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.ordersService.cancelOrder(order.id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.actionDone.set('cancelled');
        this.fetchOrder(order.id);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível cancelar o pedido.'));
      },
    });
  }

  toggleRefundForm(): void {
    this.showRefundForm.update((current) => !current);
  }

  submitRefundRequest(): void {
    const order = this.order();
    if (!order || this.refundReason().trim().length === 0) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.ordersService.requestRefund(order.id, this.refundReason().trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.actionDone.set('refund-requested');
        this.showRefundForm.set(false);
        this.fetchOrder(order.id);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível solicitar o estorno.'));
      },
    });
  }

  private fetchOrder(orderId: string): void {
    this.loading.set(true);
    this.ordersService.getOrder(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const apiError = err.error as ApiError | undefined;
    return apiError?.message ?? fallback;
  }
}
