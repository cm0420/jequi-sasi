import { Component } from '@angular/core';
import { SiteHeaderComponent } from '../../../shared/ui/site-header/site-header.component';
import { BackLinkComponent } from '../../../shared/ui/back-link/back-link.component';
import { CardFormComponent } from '../../payments/card-form/card-form.component';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [SiteHeaderComponent, BackLinkComponent, CardFormComponent],
  template: `
    <div class="min-h-screen">
      <app-site-header />
      <main id="conteudo" class="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <app-back-link to="/cliente" label="Minha conta" />

        <div class="mb-8">
          <p class="font-body text-xs tracking-[2px] uppercase text-clay mb-1">Minha conta</p>
          <h1 class="font-display text-4xl text-ink">Formas de pagamento</h1>
        </div>

        <div class="bg-surface border border-hairline rounded-3xl p-6 text-center mb-6">
          <p class="font-body text-base text-ink/60">Você ainda não tem nenhum cartão cadastrado.</p>
        </div>

        <app-card-form />
      </main>
    </div>
  `,
})
export class PaymentMethodsComponent {}
