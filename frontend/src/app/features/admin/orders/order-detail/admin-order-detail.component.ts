import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminOrdersService } from '../../admin-orders.service';
import { AdminOrderDetailResponse } from '../../../../core/models/admin.model';
import { ORDER_STATUS_LABEL } from '../../../../core/models/order.model';
import { ApiError } from '../../../../core/models/api-error.model';
import { BackLinkComponent } from '../../../../shared/ui/back-link/back-link.component';

type Tab = 'detalhes' | 'acoes';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CurrencyPipe, BackLinkComponent],
  templateUrl: './admin-order-detail.component.html',
})
export class AdminOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminOrdersService = inject(AdminOrdersService);

  readonly statusLabel = ORDER_STATUS_LABEL;

  readonly tab = signal<Tab>('detalhes');

  readonly detail = signal<AdminOrderDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly showShipForm = signal(false);
  readonly trackingCode = signal('');

  readonly canMarkPaid = computed(() => this.detail()?.order.status === 'AGUARDANDO_PAGAMENTO');
  readonly canShip = computed(() => this.detail()?.order.status === 'PAGO');
  readonly canDeliver = computed(() => this.detail()?.order.status === 'ENVIADO');
  readonly canCancel = computed(() => {
    const status = this.detail()?.order.status;
    return status === 'CARRINHO' || status === 'AGUARDANDO_PAGAMENTO';
  });
  readonly canDecideRefund = computed(() => this.detail()?.order.status === 'ESTORNO_SOLICITADO');
  readonly hasActions = computed(
    () => this.canMarkPaid() || this.canShip() || this.canDeliver() || this.canCancel() || this.canDecideRefund()
  );

  private orderId = '';

  switchTab(tab: Tab): void {
    this.tab.set(tab);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.orderId = id;
    this.fetchDetail();
  }

  markAsPaid(): void {
    this.runAction(this.adminOrdersService.markAsPaid(this.orderId), 'Pedido marcado como pago.');
  }

  toggleShipForm(): void {
    this.showShipForm.update((current) => !current);
  }

  submitShip(): void {
    if (this.trackingCode().trim().length === 0) return;
    this.runAction(
      this.adminOrdersService.ship(this.orderId, this.trackingCode().trim()),
      'Pedido marcado como enviado.'
    );
    this.showShipForm.set(false);
  }

  deliver(): void {
    this.runAction(this.adminOrdersService.deliver(this.orderId), 'Pedido marcado como entregue.');
  }

  cancelOrder(): void {
    if (!confirm('Cancelar este pedido? As peças voltam para o estoque.')) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.adminOrdersService.cancel(this.orderId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.actionMessage.set('Pedido cancelado.');
        this.fetchDetail();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível cancelar o pedido.'));
      },
    });
  }

  approveRefund(): void {
    this.runAction(this.adminOrdersService.approveRefund(this.orderId), 'Estorno aprovado.');
  }

  denyRefund(): void {
    this.runAction(this.adminOrdersService.denyRefund(this.orderId), 'Estorno negado.');
  }

  private runAction(action$: Observable<unknown>, successMessage: string): void {
    this.submitting.set(true);
    this.errorMessage.set(null);
    action$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.actionMessage.set(successMessage);
        this.fetchDetail();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível concluir a ação.'));
      },
    });
  }

  private fetchDetail(): void {
    this.loading.set(true);
    this.adminOrdersService.getOrderDetail(this.orderId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
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
