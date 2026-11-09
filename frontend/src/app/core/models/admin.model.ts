import { OrderResponse } from './order.model';
import { PaymentResponse } from './payment.model';

export interface SalesReportResponse {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface BestSellingPieceResponse {
  pieceId: string;
  pieceName: string;
  totalQuantitySold: number;
}

export interface StockAdjustmentRequest {
  delta: number;
  reason: string;
}

export interface StockAdjustmentResponse {
  id: string;
  pieceId: string;
  delta: number;
  newStock: number;
  reason: string;
  adjustedByEmail: string;
  createdAt: string;
}

export interface AdminOrderDetailResponse {
  order: OrderResponse;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  payments: PaymentResponse[];
}

export interface DailySalesResponse {
  date: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrderStatusCountResponse {
  status: string;
  count: number;
}

export type UserRole = 'ADMIN' | 'CLIENTE';

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  role: UserRole;
}
