import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AdminService } from '../admin.service';

interface NavItem {
  path: string;
  label: string;
  icon: string; // path "d" de um ícone 24x24 em traço
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- barra do topo no celular -->
    <div class="lg:hidden glass sticky top-0 z-40 border-b border-hairline/80 h-16 px-4 flex items-center justify-between">
      <a routerLink="/admin" class="font-display text-2xl text-ink">Jequí</a>
      <button
        type="button"
        class="h-11 w-11 rounded-full border border-hairline bg-surface/70 flex items-center justify-center text-ink"
        [attr.aria-expanded]="menuOpen()"
        aria-controls="admin-sidebar"
        [attr.aria-label]="menuOpen() ? 'Fechar menu' : 'Abrir menu'"
        (click)="menuOpen.set(!menuOpen())"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          @if (menuOpen()) { <path d="M6,6 L18,18 M18,6 L6,18" /> } @else { <path d="M4,7 H20 M4,12 H20 M4,17 H20" /> }
        </svg>
      </button>
    </div>

    @if (menuOpen()) {
      <div class="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm" (click)="menuOpen.set(false)" aria-hidden="true"></div>
    }

    <aside
      id="admin-sidebar"
      class="fixed inset-y-0 left-0 z-50 w-72 bg-espresso text-canvas flex flex-col overscroll-contain
             transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0"
      [class.-translate-x-full]="!menuOpen()"
      aria-label="Menu do painel"
    >
      <div class="sidebar-glow" aria-hidden="true"></div>

      <div class="relative px-6 pt-7 pb-6">
        <a routerLink="/admin" class="block font-display text-[28px] leading-none text-canvas">Jequí</a>
        <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-canvas/10 px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-pale">
          <span class="h-1.5 w-1.5 rounded-full bg-gold-pale" aria-hidden="true"></span>
          Painel admin
        </span>
      </div>

      <nav class="relative flex-1 overflow-y-auto px-3 pb-4" aria-label="Seções do painel">
        @for (group of groups; track group.title) {
          <p class="px-3 pt-5 pb-2 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-canvas/50">{{ group.title }}</p>
          <ul class="flex flex-col gap-0.5">
            @for (item of group.items; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="nav-active"
                  [routerLinkActiveOptions]="{ exact: !!item.exact }"
                  class="nav-item group flex items-center gap-3 h-11 rounded-full px-3 font-body text-[15px] text-canvas/75 hover:text-canvas hover:bg-canvas/[0.07]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true">
                    <path [attr.d]="item.icon" />
                  </svg>
                  <span class="flex-1">{{ item.label }}</span>
                  @if (item.path === '/admin/pedidos' && attention() > 0) {
                    <span class="min-w-6 h-6 px-1.5 rounded-full bg-gold text-espresso font-body text-xs font-bold flex items-center justify-center"
                          [attr.aria-label]="attention() + ' pedidos precisam de atenção'">{{ attention() }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        }
      </nav>

      <div class="relative border-t border-canvas/10 p-4 flex items-center gap-3">
        <span class="h-10 w-10 shrink-0 rounded-full bg-sage text-espresso flex items-center justify-center font-body font-bold uppercase" aria-hidden="true">
          {{ initial() }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-body text-sm text-canvas" [title]="email() ?? ''">{{ email() }}</p>
          <p class="font-body text-xs text-canvas/50">Administrador</p>
        </div>
        <button
          type="button"
          (click)="logout()"
          class="h-10 w-10 rounded-full flex items-center justify-center text-canvas/70 hover:text-canvas hover:bg-canvas/10"
          aria-label="Sair"
          title="Sair"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M15,4 H19 V20 H15 M10,8 L14,12 L10,16 M14,12 H3" />
          </svg>
        </button>
      </div>
    </aside>

    <div class="lg:pl-72 min-h-screen">
      <router-outlet />
    </div>
  `,
  styles: `
    .sidebar-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(60% 40% at 0% 0%, rgba(132, 150, 113, 0.35), transparent 70%),
        radial-gradient(50% 35% at 100% 100%, rgba(175, 117, 27, 0.25), transparent 70%);
    }
    .nav-active {
      background: #f7f1e8;
      color: #39221e;
      font-weight: 600;
    }
    .nav-active:hover {
      background: #f7f1e8;
      color: #39221e;
    }
  `,
})
export class AdminShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly attention = signal(0);
  readonly email = this.authService.email;
  readonly initial = computed(() => (this.email() ?? '?').charAt(0));

  readonly groups: NavGroup[] = [
    {
      title: 'Geral',
      items: [
        { path: '/admin', label: 'Visão geral', icon: 'M4,13 H10 V20 H4 Z M14,4 H20 V20 H14 Z M4,4 H10 V9 H4 Z', exact: true },
        { path: '/admin/pedidos', label: 'Pedidos', icon: 'M4,7 H20 L18,20 H6 Z M9,7 V5 A3,3 0 0 1 15,5 V7' },
      ],
    },
    {
      title: 'Catálogo',
      items: [
        { path: '/admin/pecas', label: 'Peças', icon: 'M4,8 L12,4 L20,8 L12,12 Z M4,8 V16 L12,20 V12 M20,8 V16 L12,20' },
        { path: '/admin/conjuntos', label: 'Conjuntos', icon: 'M3,3 H11 V11 H3 Z M13,3 H21 V11 H13 Z M3,13 H11 V21 H3 Z M13,13 H21 V21 H13 Z' },
        { path: '/admin/categorias', label: 'Categorias', icon: 'M4,5 H11 L13,8 H20 V19 H4 Z' },
      ],
    },
    {
      title: 'Pessoas',
      items: [
        { path: '/admin/usuarios', label: 'Usuários', icon: 'M9,11 A4,4 0 1 0 9,3 A4,4 0 1 0 9,11 M2,21 C2,16 5,14 9,14 C13,14 16,16 16,21 M16,4 A3.5,3.5 0 0 1 16,11 M19,14 C21,15 22,17 22,21' },
      ],
    },
  ];

  ngOnInit(): void {
    // Fecha a gaveta ao trocar de tela no celular.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.menuOpen.set(false));

    this.adminService.getOrdersByStatus().subscribe((rows) =>
      this.attention.set(
        rows.filter((r) => r.status === 'PAGO' || r.status === 'ESTORNO_SOLICITADO').reduce((s, r) => s + r.count, 0)
      )
    );
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
