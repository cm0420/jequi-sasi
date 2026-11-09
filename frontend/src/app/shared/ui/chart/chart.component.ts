import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';

export interface ChartDatum {
  label: string;
  value: number;
  /** Rótulo longo para tooltip e tabela (ex.: data por extenso). */
  detail?: string;
  color?: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'hbar';

/** Paleta categórica validada (validate_palette.js, fundo #fffcf7): ordem fixa, nunca reciclada. */
export const SERIES_COLORS = ['#2e7d46', '#b07d1a', '#3b78b0', '#c0562e', '#7d3a6a'];

const PAD = { top: 16, right: 12, bottom: 28, left: 64 };

/** Teto "redondo" do eixo (1, 2, 2.5, 5 × 10^n) para as linhas de grade caírem em números legíveis. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return step * exp;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  host: { class: 'block relative' },
  template: `
    @if (data().length === 0) {
      <p class="font-body text-sm text-stone py-10 text-center">Sem dados no período.</p>
    } @else if (showTable()) {
      <div class="overflow-x-auto max-h-80">
        <table class="w-full font-body text-sm">
          <caption class="sr-only">{{ ariaLabel() }}</caption>
          <thead class="sticky top-0 bg-surface">
            <tr class="text-left text-[11px] uppercase tracking-[0.12em] text-stone">
              <th scope="col" class="py-2 pr-4 font-semibold">Item</th>
              <th scope="col" class="py-2 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            @for (d of data(); track $index) {
              <tr class="border-t border-hairline">
                <td class="py-2 pr-4 text-ink">{{ d.detail ?? d.label }}</td>
                <td class="py-2 text-right text-ink tabular-nums">{{ format()(d.value) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else if (type() === 'donut') {
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <svg viewBox="0 0 200 200" class="w-44 h-44 shrink-0 -rotate-90" role="img" [attr.aria-label]="ariaLabel()">
          @for (s of donut(); track s.label) {
            <circle
              cx="100" cy="100" r="76" fill="none"
              [attr.stroke]="s.color"
              [attr.stroke-width]="hover() === $index ? 30 : 24"
              [attr.stroke-dasharray]="s.dash"
              [attr.stroke-dashoffset]="s.offset"
              class="transition-[stroke-width] duration-200"
              (pointerenter)="hover.set($index)"
              (pointerleave)="hover.set(null)"
            />
          }
        </svg>
        <ul class="flex-1 w-full flex flex-col gap-1.5 font-body text-sm">
          @for (s of donut(); track s.label) {
            <li
              class="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors"
              [class.bg-cream]="hover() === $index"
              (pointerenter)="hover.set($index)"
              (pointerleave)="hover.set(null)"
            >
              <span class="h-3 w-3 rounded-full shrink-0" [style.background]="s.color" aria-hidden="true"></span>
              <span class="flex-1 text-ink">{{ s.label }}</span>
              <span class="tabular-nums text-ink font-semibold">{{ format()(s.value) }}</span>
              <span class="tabular-nums text-stone w-12 text-right">{{ s.pct }}%</span>
            </li>
          }
        </ul>
      </div>
    } @else if (type() === 'hbar') {
      <ul class="flex flex-col gap-3 font-body text-sm" [attr.aria-label]="ariaLabel()">
        @for (d of data(); track $index) {
          <li class="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
            <span class="truncate text-ink" [title]="d.label">{{ d.label }}</span>
            <span class="h-3 rounded-full bg-cream overflow-hidden">
              <span
                class="block h-full rounded-full bar-grow"
                [style.width.%]="(d.value / max()) * 100"
                [style.background]="d.color ?? colors[0]"
              ></span>
            </span>
            <span class="tabular-nums text-ink font-semibold min-w-10 text-right">{{ format()(d.value) }}</span>
          </li>
        }
      </ul>
    } @else {
      <svg
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        [attr.width]="width()"
        [attr.height]="height()"
        class="block w-full overflow-visible"
        role="img"
        [attr.aria-label]="ariaLabel()"
        (pointerleave)="hover.set(null)"
      >
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.32" />
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>

        @for (t of ticks(); track t.value) {
          <line [attr.x1]="pad.left" [attr.x2]="width() - pad.right" [attr.y1]="t.y" [attr.y2]="t.y"
                stroke="#e1dcd3" stroke-width="1" [attr.stroke-dasharray]="t.value === 0 ? null : '3 4'" />
          <text [attr.x]="pad.left - 10" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle"
                class="fill-stone font-body text-[11px] tabular-nums">{{ format()(t.value) }}</text>
        }
        @for (x of xTicks(); track x.i) {
          <text [attr.x]="x.x" [attr.y]="height() - 8" text-anchor="middle" class="fill-stone font-body text-[11px]">{{ x.label }}</text>
        }

        @if (type() === 'bar') {
          @for (b of bars(); track $index) {
            <path [attr.d]="b.d" [attr.fill]="color()" [attr.opacity]="hover() === null || hover() === $index ? 1 : 0.45"
                  class="transition-opacity duration-150" />
          }
        } @else {
          @if (type() === 'area') {
            <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradId + ')'" />
          }
          <path [attr.d]="linePath()" fill="none" [attr.stroke]="color()" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round" class="line-draw" />
          @if (hover() !== null) {
            <line [attr.x1]="points()[hover()!].x" [attr.x2]="points()[hover()!].x"
                  [attr.y1]="pad.top" [attr.y2]="height() - pad.bottom" stroke="#4a4741" stroke-width="1" stroke-dasharray="3 3" />
            <circle [attr.cx]="points()[hover()!].x" [attr.cy]="points()[hover()!].y" r="5"
                    [attr.fill]="color()" stroke="#fffcf7" stroke-width="2" />
          }
        }

        <!-- alvos de hover: a coluna inteira, maior que a marca -->
        @for (p of points(); track $index) {
          <rect [attr.x]="p.x - step() / 2" [attr.y]="pad.top" [attr.width]="step()"
                [attr.height]="height() - pad.top - pad.bottom" fill="transparent"
                (pointerenter)="hover.set($index)" />
        }
      </svg>

      @if (hover() !== null) {
        <div
          class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-2 rounded-xl bg-ink text-canvas px-3 py-2 font-body text-xs shadow-lift whitespace-nowrap"
          [style.left.px]="points()[hover()!].x"
          role="status"
        >
          <div class="text-canvas/70">{{ data()[hover()!].detail ?? data()[hover()!].label }}</div>
          <div class="text-sm font-semibold tabular-nums">{{ format()(data()[hover()!].value) }}</div>
        </div>
      }
    }
  `,
  styles: `
    .bar-grow { animation: grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; transform-origin: left; }
    .line-draw { stroke-dasharray: 4000; animation: draw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @keyframes grow { from { transform: scaleX(0); } }
    @keyframes draw { from { stroke-dashoffset: 4000; } to { stroke-dashoffset: 0; } }
  `,
})
export class ChartComponent implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer?: ResizeObserver;
  private static nextId = 0;

  readonly data = input.required<ChartDatum[]>();
  readonly type = input<ChartType>('bar');
  readonly ariaLabel = input('Gráfico');
  readonly showTable = input(false);
  readonly height = input(260);
  readonly color = input(SERIES_COLORS[0]);
  readonly format = input<(n: number) => string>((n) => n.toLocaleString('pt-BR'));

  readonly colors = SERIES_COLORS;
  readonly pad = PAD;
  readonly gradId = `chart-grad-${ChartComponent.nextId++}`;
  readonly width = signal(640);
  readonly hover = signal<number | null>(null);

  readonly max = computed(() => niceMax(Math.max(0, ...this.data().map((d) => d.value))));
  private readonly plotW = computed(() => this.width() - PAD.left - PAD.right);
  private readonly plotH = computed(() => this.height() - PAD.top - PAD.bottom);
  readonly step = computed(() => this.plotW() / Math.max(1, this.data().length));

  private readonly y = (v: number) => PAD.top + this.plotH() - (v / this.max()) * this.plotH();

  readonly points = computed(() =>
    this.data().map((d, i) => ({ x: PAD.left + this.step() * (i + 0.5), y: this.y(d.value) }))
  );

  readonly ticks = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({ value: this.max() * f, y: this.y(this.max() * f) }))
  );

  /** No máximo ~7 rótulos no eixo X, sempre incluindo o primeiro e o último. */
  readonly xTicks = computed(() => {
    const n = this.data().length;
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(this.plotW() / 90))));
    const idx = this.data().map((_, i) => i).filter((i) => i % every === 0);
    // o último dia entra se não ficar colado no rótulo anterior
    if (n - 1 - idx[idx.length - 1] >= every / 2) idx.push(n - 1);
    return idx.map((i) => ({ i, label: this.data()[i].label, x: this.points()[i].x }));
  });

  /** Barras com topo arredondado 4px, presas à linha de base; 2px de respiro entre barras. */
  readonly bars = computed(() => {
    const w = Math.max(2, Math.min(28, this.step() - 2));
    const base = this.y(0);
    return this.points().map((p) => {
      const h = base - p.y;
      if (h <= 0) return { d: '' };
      const r = Math.min(4, w / 2, h);
      const x = p.x - w / 2;
      return {
        d: `M${x},${base} V${p.y + r} Q${x},${p.y} ${x + r},${p.y} H${x + w - r} Q${x + w},${p.y} ${x + w},${p.y + r} V${base} Z`,
      };
    });
  });

  readonly linePath = computed(() => this.points().map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '));
  readonly areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const base = this.y(0);
    return `${this.linePath()} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`;
  });

  readonly donut = computed(() => {
    const total = this.data().reduce((s, d) => s + d.value, 0) || 1;
    const c = 2 * Math.PI * 76;
    let acc = 0;
    return this.data().map((d, i) => {
      const len = (d.value / total) * c;
      // 2px de respiro entre fatias
      const seg = {
        label: d.label,
        value: d.value,
        color: d.color ?? SERIES_COLORS[i] ?? '#838280', // além da 5ª fatia: cinza, nunca uma cor reciclada
        dash: `${Math.max(0, len - 2)} ${c}`,
        offset: -acc,
        pct: Math.round((d.value / total) * 100),
      };
      acc += len;
      return seg;
    });
  });

  ngOnInit(): void {
    this.observer = new ResizeObserver(([entry]) => this.width.set(Math.max(280, Math.floor(entry.contentRect.width))));
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
