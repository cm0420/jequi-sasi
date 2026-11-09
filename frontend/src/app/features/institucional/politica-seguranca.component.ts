import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../shared/ui/site-header/site-header.component';

/**
 * Página institucional / social da Jequí (TPI SASI).
 *
 * Fica disponível em HTTP (conteúdo público, sem dado sensível) e apresenta a empresa
 * e a política de segurança. O botão "Entrar com segurança" leva ao login, que o
 * secureChannelGuard força para HTTPS (porta 8443).
 */
@Component({
  selector: 'app-politica-seguranca',
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent],
  template: `
    <app-site-header />

    <main id="conteudo" class="mx-auto max-w-3xl px-4 py-12">
      <section class="mb-14">
        <p class="font-body text-sm font-semibold uppercase tracking-wide text-clay">Quem somos</p>
        <h1 class="mt-2 font-display text-4xl text-ink">Jequí, artesanatos do vale</h1>
        <p class="mt-5 font-body text-stone leading-relaxed">
          A Jequí nasce no Vale do Jequitinhonha, em Minas Gerais, reunindo peças de cerâmica e
          barro pintadas à mão por um único artesão. Cada peça é única, feita com argila da região
          e técnicas passadas de geração em geração. Vendemos o que já existe no ateliê — você
          recebe exatamente a peça que viu na foto.
        </p>
      </section>

      <section class="rounded-2xl border border-hairline bg-surface p-7 shadow-soft">
        <h2 class="font-display text-2xl text-ink">Política de segurança e privacidade</h2>
        <p class="mt-3 font-body text-sm text-stone leading-relaxed">
          Levamos a sério a proteção dos dados de quem compra na Jequí. Estes são os compromissos
          que aplicamos na loja:
        </p>

        <ul class="mt-6 space-y-5">
          <li>
            <p class="font-body font-semibold text-ink">Conexão protegida onde importa</p>
            <p class="font-body text-sm text-stone leading-relaxed">
              O cadastro, o login, o checkout, os pedidos e a área da conta trafegam sempre por
              HTTPS, com certificado digital. As páginas públicas (catálogo e esta página) ficam
              abertas também em HTTP, sem expor nenhum dado pessoal.
            </p>
          </li>
          <li>
            <p class="font-body font-semibold text-ink">Senhas nunca guardadas em texto</p>
            <p class="font-body text-sm text-stone leading-relaxed">
              As senhas são armazenadas apenas como hash (BCrypt). Nem a equipe da Jequí consegue
              lê-las.
            </p>
          </li>
          <li>
            <p class="font-body font-semibold text-ink">Acesso só ao que é seu</p>
            <p class="font-body text-sm text-stone leading-relaxed">
              Cada pessoa só enxerga os próprios pedidos, endereços e dados de conta. O acesso é
              controlado por autenticação e por perfil (cliente ou administrador).
            </p>
          </li>
          <li>
            <p class="font-body font-semibold text-ink">Dados usados só para a compra</p>
            <p class="font-body text-sm text-stone leading-relaxed">
              Coletamos apenas o necessário para processar o pedido e a entrega. Não vendemos nem
              compartilhamos seus dados com terceiros para fins de propaganda.
            </p>
          </li>
          <li>
            <p class="font-body font-semibold text-ink">Fale com a gente</p>
            <p class="font-body text-sm text-stone leading-relaxed">
              Para corrigir ou apagar seus dados, é só entrar em contato pela conta. Atendemos cada
              pedido individualmente.
            </p>
          </li>
        </ul>

        <a
          routerLink="/login"
          class="mt-8 inline-flex h-11 items-center rounded-full bg-forest px-6 font-body text-sm font-medium text-canvas hover:bg-moss"
        >
          Entrar com segurança (HTTPS)
        </a>
      </section>
    </main>
  `,
})
export class PoliticaSegurancaComponent {}
