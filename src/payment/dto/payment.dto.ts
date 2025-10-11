import { IsEnum, IsNumber, IsString, IsOptional, IsObject, Min, Max } from 'class-validator';
import { PaymentMethod, PaymentGateway } from '@prisma/client';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  @Max(100000)
  amount: number;

  @IsString()
  currency: string; // USD, EUR, BTC, ETH, etc.

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateCryptoPaymentDto extends CreatePaymentDto {
  @IsString()
  cryptoNetwork: string; // Bitcoin, Ethereum, Tron, etc.

  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredConfirmations?: number = 1;
}

export class CreateFiatPaymentDto extends CreatePaymentDto {
  @IsOptional()
  @IsObject()
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @IsOptional()
  @IsString()
  cardToken?: string; // For Stripe tokenized cards
}

export class ProcessPaymentDto {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsObject()
  paymentData?: Record<string, any>;
}

export class VerifyPaymentDto {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsString()
  transactionHash?: string; // For crypto payments
}

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetPaymentStatusDto {
  @IsString()
  paymentId: string;
}
