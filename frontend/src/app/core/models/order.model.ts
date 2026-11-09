export type OrderStatus =
  | 'CARRINHO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'EXPIRADO'
  | 'ESTORNO_SOLICITADO'
  | 'ESTORNADO';

export interface OrderItemResponse {
  id: string;
  pieceId: string | null;
  pieceSetId: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  totalAmount: number;
  recipientName: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingCost: number | null;
  shippingOptionName: string | null;
  estimatedDeliveryDays: number | null;
  trackingCode: string | null;
  checkoutStartedAt: string | null;
  refundReason: string | null;
  refundRequestedAt: string | null;
  refundDecidedAt: string | null;
  createdAt: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CARRINHO: 'Carrinho',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pago',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  EXPIRADO: 'Expirado',
  ESTORNO_SOLICITADO: 'Estorno solicitado',
  ESTORNADO: 'Estornado',
};

export interface AddOrderItemRequest {
  pieceId?: string;
  pieceSetId?: string;
  quantity: number;
}

export interface UpdateOrderItemRequest {
  quantity: number;
}
