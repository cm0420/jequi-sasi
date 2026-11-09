export interface InitiatePaymentRequest {
  simulateOutcome?: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  transactionId: string;
  status: string;
  amount: number;
  provider: string;
  createdAt: string;
}
