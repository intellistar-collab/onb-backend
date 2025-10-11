export interface PaymentProvider {
  createPayment(data: CreatePaymentData): Promise<PaymentResult>;
  verifyPayment(paymentId: string, data?: any): Promise<PaymentStatus>;
  refundPayment(paymentId: string, amount: number, reason?: string): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

export interface CreatePaymentData {
  amount: number;
  currency: string;
  paymentMethod: string;
  description?: string;
  metadata?: Record<string, any>;
  userId: string;
  walletId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  gatewayId?: string;
  gatewayData?: Record<string, any>;
  redirectUrl?: string;
  qrCode?: string;
  address?: string;
  expiresAt?: Date;
  error?: string;
}

export interface PaymentStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  gatewayId?: string;
  gatewayData?: Record<string, any>;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  gatewayRefundId?: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface CryptoAddressData {
  address: string;
  network: string;
  qrCode: string;
  expiresAt: Date;
}
