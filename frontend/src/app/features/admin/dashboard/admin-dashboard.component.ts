import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../admin.service';
import { BestSellingPieceResponse, DailySalesResponse, OrderStatusCountResponse } from '../../../core/models/admin.model';
import { OrderResponse } from '../../../core/models/order.model';
import { ChartComponent, ChartDatum, ChartType, SERIES_COLORS } from '../../../shared/ui/chart/chart.component';

/** yyyy-MM-dd no fuso do navegador (toISOString usaria UTC e viraria o dia às 21h no Brasil). */
export function toLocalDateValue(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function addDays(value: string, days: number): string {
  const [y, m, d] = value.split('-').map(Number);
  return toLocalDateValue(new Date(y, m - 1, d + days));
}

function daysBetween(start: string, end: string): number {
  const [y1, m1, d1] = start.split('-').map(Number);
  const [y2, m2, d2] = end.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL_COMPACT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
const INT = new Intl.NumberFormat('pt-BR');
const DAY_SHORT = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const DAY_LONG = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });

/** Status agrupados como o admin pensa neles; ordem fixa = cor fixa. */
const STATUS_GROUPS: { label: string; statuses: string[] }[] = [
  { label: 'Entregue', statuses: ['ENTREGUE'] },
  { label: 'Pago, a enviar', statuses: ['PAGO'] },
  { label: 'Enviado', statuses: ['ENVIADO'] },
  { label: 'Aguardando pagamento', statuses: ['AGUARDANDO_PAGAMENTO'] },
  { label: 'Estorno', statuses: ['ESTORNO_SOLICITADO', 'ESTORNADO'] },
  { label: 'Cancelado ou expirado', statuses: ['CANCELADO', 'EXPIRADO'] },
];

type Metric = 'revenue' | 'orders';
const PRESETS = [7, 30, 90, 365];
const PENDING_PAGE_SIZE = 6;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ChartComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly presets = PRESETS;
  readonly today = toLocalDateValue(new Date());
  readonly preset = signal<number | null>(30);
  readonly startDate = signal(addDays(this.today, -29));
  readonly endDate = signal(this.today);
  readonly rangeError = signal<string | null>(null);

  readonly metric = signal<Metric>('revenue');
  readonly salesChartType = signal<ChartType>('area');
  readonly statusChartType = signal<ChartType>('donut');
  readonly topLimit = signal(5);
  readonly tableView = signal<Record<string, boolean>>({});

  readonly daily = signal<DailySalesResponse[]>([]);
  readonly previous = signal<DailySalesResponse[]>([]);
  readonly salesLoading = signal(true);
  readonly statusCounts = signal<OrderStatusCountResponse[]>([]);
  readonly bestSelling = signal<BestSellingPieceResponse[]>([]);
  readonly pendingOrders = signal<OrderResponse[]>([]);
  readonly pendingPage = signal(0);
  readonly pendingTotalPages = signal(0);
  readonly pendingTotal = signal(0);
  readonly loadError = signal<string | null>(null);

  readonly salesTypes: { value: ChartType; label: string }[] = [
    { value: 'area', label: 'Área' },
    { value: 'line', label: 'Linha' },
    { value: 'bar', label: 'Barras' },
  ];
  readonly statusTypes: { value: ChartType; label: string }[] = [
    { value: 'donut', label: 'Rosca' },
    { value: 'hbar', label: 'Barras' },
  ];

  private sum(rows: DailySalesResponse[], key: 'totalRevenue' | 'totalOrders'): number {
    return rows.reduce((s, r) => s + Number(r[key]), 0);
  }

  readonly revenue = computed(() => this.sum(this.daily(), 'totalRevenue'));
  readonly orders = computed(() => this.sum(this.daily(), 'totalOrders'));
  readonly avgTicket = computed(() => (this.orders() ? this.revenue() / this.orders() : 0));
  readonly prevRevenue = computed(() => this.sum(this.previous(), 'totalRevenue'));
  readonly prevOrders = computed(() => this.sum(this.previous(), 'totalOrders'));
  readonly prevAvgTicket = computed(() => (this.prevOrders() ? this.prevRevenue() / this.prevOrders() : 0));

  readonly toShip = computed(() => this.countOf('PAGO'));
  readonly refunds = computed(() => this.countOf('ESTORNO_SOLICITADO'));

  readonly kpis = computed(() => [
    { label: 'Receita', value: BRL.format(this.revenue()), delta: this.delta(this.revenue(), this.prevRevenue()), tone: 'forest' },
    { label: 'Pedidos pagos', value: INT.format(this.orders()), delta: this.delta(this.orders(), this.prevOrders()), tone: 'gold' },
    { label: 'Ticket médio', value: BRL.format(this.avgTicket()), delta: this.delta(this.avgTicket(), this.prevAvgTicket()), tone: 'clay' },
  ]);

  readonly salesData = computed<ChartDatum[]>(() => {
    return this.daily().map((r) => {
      const d = new Date(r.date + 'T12:00:00');
      return {
        label: DAY_SHORT.format(d).replace('.', ''),
        detail: DAY_LONG.format(d),
        value: Number(this.metric() === 'revenue' ? r.totalRevenue : r.totalOrders),
      };
    });
  });

  readonly salesFormat = computed(() =>
    this.metric() === 'revenue' ? (n: number) => BRL_COMPACT.format(n) : (n: number) => INT.format(n)
  );
  readonly salesColor = computed(() => (this.metric() === 'revenue' ? SERIES_COLORS[0] : SERIES_COLORS[1]));

  readonly statusData = computed<ChartDatum[]>(() =>
    STATUS_GROUPS.map((g, i) => ({
      label: g.label,
      value: g.statuses.reduce((s, st) => s + this.countOf(st), 0),
      color: SERIES_COLORS[i] ?? '#838280',
    })).filter((d) => d.value > 0)
  );

  readonly topData = computed<ChartDatum[]>(() =>
    this.bestSelling()
      .slice(0, this.topLimit())
      .map((p) => ({ label: p.pieceName, value: p.totalQuantitySold, color: SERIES_COLORS[0] }))
  );

  readonly intFormat = (n: number) => INT.format(n);
  readonly unitFormat = (n: number) => `${INT.format(n)} un.`;

  ngOnInit(): void {
    this.loadSales();
    this.adminService.getOrdersByStatus().subscribe((rows) => this.statusCounts.set(rows));
    this.adminService.getBestSellingPieces(10).subscribe((rows) => this.bestSelling.set(rows));
    this.loadPending();
  }

  choosePreset(days: number): void {
    this.preset.set(days);
    this.endDate.set(this.today);
    this.startDate.set(addDays(this.today, -(days - 1)));
    this.loadSales();
  }

  setCustomRange(start: string, end: string): void {
    this.preset.set(null);
    this.startDate.set(start);
    this.endDate.set(end);
    this.loadSales();
  }

  toggleTable(key: string): void {
    this.tableView.update((t) => ({ ...t, [key]: !t[key] }));
  }

  goToPendingPage(delta: number): void {
    this.pendingPage.update((p) => p + delta);
    this.loadPending();
  }

  private loadSales(): void {
    const start = this.startDate();
    const end = this.endDate();
    const span = daysBetween(start, end);
    if (!start || !end || span < 0) {
      this.rangeError.set('A data final precisa ser igual ou depois da inicial.');
      return;
    }
    if (span >= 366) {
      this.rangeError.set('Escolha um período de até 366 dias.');
      return;
    }
    this.rangeError.set(null);
    this.salesLoading.set(true);

    // Período anterior do mesmo tamanho, para a variação dos indicadores.
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -span);
    forkJoin([this.adminService.getDailySales(start, end), this.adminService.getDailySales(prevStart, prevEnd)]).subscribe({
      next: ([current, previous]) => {
        this.daily.set(current);
        this.previous.set(previous);
        this.salesLoading.set(false);
      },
      error: () => {
        this.salesLoading.set(false);
        this.loadError.set('Não foi possível carregar as vendas. Tente de novo em instantes.');
      },
    });
  }

  private loadPending(): void {
    this.adminService.getPendingShipmentOrders(this.pendingPage(), PENDING_PAGE_SIZE).subscribe((result) => {
      this.pendingOrders.set(result.content);
      this.pendingTotalPages.set(result.totalPages);
      this.pendingTotal.set(result.totalElements);
    });
  }

  private countOf(status: string): number {
    return this.statusCounts().find((r) => r.status === status)?.count ?? 0;
  }

  /** Variação % contra o período anterior; null quando não há base de comparação. */
  private delta(current: number, previous: number): number | null {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }
}
