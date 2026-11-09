import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CheckoutService } from '../checkout.service';
import { CartService } from '../../cart/cart.service';
import { ClienteService } from '../../cliente/cliente.service';
import { AddressRequest, AddressResponse } from '../../../core/models/customer.model';
import { OrderResponse } from '../../../core/models/order.model';
import { ShippingQuoteResponse } from '../../../core/models/shipping.model';
import { PaymentResponse } from '../../../core/models/payment.model';
import { ApiError } from '../../../core/models/api-error.model';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';
import { AddressFormComponent } from '../../../shared/ui/address-form/address-form.component';
import { CardFormComponent } from '../../payments/card-form/card-form.component';

type Step = 'address' | 'shipping' | 'payment' | 'result';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, SiteHeaderComponent, BackLinkComponent, AddressFormComponent, CardFormComponent],
  templateUrl: './checkout-page.component.html',
})
export class CheckoutPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutService = inject(CheckoutService);
  private readonly cartService = inject(CartService);
  private readonly clienteService = inject(ClienteService);

  readonly order = signal<OrderResponse | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly addresses = signal<AddressResponse[]>([]);
  readonly selectedAddressId = signal<string | null>(null);
  readonly showNewAddressForm = signal(false);

  readonly shippingQuotes = signal<ShippingQuoteResponse[] | null>(null);
  readonly selectedShippingCode = signal<string | null>(null);

  readonly paymentResult = signal<PaymentResponse | null>(null);

  readonly step = computed<Step>(() => {
    if (this.paymentResult()) return 'result';
    const o = this.order();
    if (!o || o.status === 'CARRINHO') return 'address';
    if (!o.shippingOptionName) return 'shipping';
    return 'payment';
  });

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.checkoutService.getOrder(orderId).subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
          if (order.status !== 'CARRINHO' && !order.shippingOptionName) {
            this.loadShippingQuotes(order.id);
          }
        },
        error: () => {
          this.errorMessage.set('Pedido não encontrado.');
          this.loading.set(false);
        },
      });
      return;
    }

    this.cartService.loadCart().subscribe((cart) => {
      this.order.set(cart);
      this.loading.set(false);
    });
    this.clienteService.listAddresses().subscribe((addresses) => {
      this.addresses.set(addresses);
      const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (defaultAddress) {
        this.selectedAddressId.set(defaultAddress.id);
      } else {
        this.showNewAddressForm.set(true);
      }
    });
  }

  toggleNewAddressForm(): void {
    this.showNewAddressForm.update((current) => !current);
  }

  submitNewAddress(request: AddressRequest): void {
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.clienteService.createAddress(request).subscribe({
      next: (address) => {
        this.submitting.set(false);
        this.addresses.update((current) => [...current, address]);
        this.selectedAddressId.set(address.id);
        this.showNewAddressForm.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível salvar o endereço.'));
      },
    });
  }

  confirmAddress(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.checkoutService.checkout(addressId).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.cartService.cart.set(null);
        this.router.navigate(['/checkout', order.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível fechar o pedido.'));
      },
    });
  }

  selectShippingOption(code: string): void {
    this.selectedShippingCode.set(code);
  }

  confirmShipping(): void {
    const o = this.order();
    const code = this.selectedShippingCode();
    if (!o || !code) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.checkoutService.selectShipping(o.id, code).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.order.set(order);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível selecionar o frete.'));
      },
    });
  }

  pay(): void {
    const o = this.order();
    if (!o) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.checkoutService.pay(o.id).subscribe({
      next: (payment) => {
        this.submitting.set(false);
        this.paymentResult.set(payment);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.extractError(err, 'Não foi possível processar o pagamento.'));
      },
    });
  }

  retryPayment(): void {
    this.paymentResult.set(null);
  }

  private loadShippingQuotes(orderId: string): void {
    this.checkoutService.getShippingQuotes(orderId).subscribe((quotes) => this.shippingQuotes.set(quotes));
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const apiError = err.error as ApiError | undefined;
    return apiError?.message ?? fallback;
  }
}
