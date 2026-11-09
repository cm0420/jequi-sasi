import { Component } from '@angular/core';

/**
 * Tela de cadastro de cartão — visual, "em desenvolvimento".
 * Não envia nada: a integração de pagamento com cartão ainda não existe no backend
 * (só o gateway fake). Reaproveitada no checkout e em "Minha conta → Formas de pagamento".
 */
@Component({
  selector: 'app-card-form',
  standalone: true,
  template: `
    <div class="bg-surface border border-hairline rounded-3xl p-5 sm:p-7 flex flex-col gap-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-2xl text-ink">Cadastrar cartão</h2>
        <span class="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-gold border border-gold/40 bg-gold/10 rounded-full px-3 py-1">
          Em desenvolvimento
        </span>
      </div>

      <!-- cartão ilustrativo -->
      <div class="relative rounded-2xl bg-espresso text-canvas p-5 h-44 flex flex-col justify-between overflow-hidden">
        <div class="hero-liquid opacity-40" aria-hidden="true"><span></span><span></span></div>
        <div class="relative z-10 flex items-center justify-between">
          <span class="font-body text-xs uppercase tracking-[0.16em] text-gold-pale">Jequí</span>
          <div class="h-6 w-9 rounded-md bg-gold-pale/80" aria-hidden="true"></div>
        </div>
        <p class="relative z-10 font-body text-lg tracking-[0.18em] text-canvas/80">•••• •••• •••• ••••</p>
        <div class="relative z-10 flex items-center justify-between font-body text-[11px] uppercase tracking-wide text-canvas/60">
          <span>Nome no cartão</span>
          <span>00/00</span>
        </div>
      </div>

      <fieldset disabled class="flex flex-col gap-4 opacity-60" aria-describedby="card-dev-note">
        <div class="flex flex-col gap-1.5">
          <label class="font-body text-[11px] tracking-wide uppercase text-ink/70">Número do cartão</label>
          <input type="text" placeholder="0000 0000 0000 0000" class="font-body border border-hairline rounded-xl px-4 py-3 text-ink bg-canvas/40" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-body text-[11px] tracking-wide uppercase text-ink/70">Nome impresso no cartão</label>
          <input type="text" placeholder="Como está no cartão" class="font-body border border-hairline rounded-xl px-4 py-3 text-ink bg-canvas/40" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="font-body text-[11px] tracking-wide uppercase text-ink/70">Validade</label>
            <input type="text" placeholder="MM/AA" class="font-body border border-hairline rounded-xl px-4 py-3 text-ink bg-canvas/40" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-body text-[11px] tracking-wide uppercase text-ink/70">CVV</label>
            <input type="text" placeholder="000" class="font-body border border-hairline rounded-xl px-4 py-3 text-ink bg-canvas/40" />
          </div>
        </div>
      </fieldset>

      <p id="card-dev-note" class="font-body text-sm text-ink/60">
        O cadastro de cartão ainda está em desenvolvimento. Assim que a integração de pagamento ficar pronta,
        será possível salvar um cartão e pagar por aqui.
      </p>

      <button
        type="button"
        disabled
        class="font-body font-semibold text-base px-7 py-3.5 rounded-full border border-ink bg-forest text-canvas opacity-50 cursor-not-allowed"
      >
        Salvar cartão
      </button>
    </div>
  `,
})
export class CardFormComponent {}
