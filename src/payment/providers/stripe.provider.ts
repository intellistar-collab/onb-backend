import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, CreatePaymentData, PaymentResult, PaymentStatus, RefundResult } from '../interfaces/payment.interface';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    // Initialize Stripe SDK
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover',
      });
    }
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized. Please set STRIPE_SECRET_KEY in environment variables.');
      }

      // Create a PaymentIntent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          userId: data.userId,
          walletId: data.walletId,
          description: data.description || 'Casino deposit',
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentId: data.userId, // This will be replaced with actual payment ID
        gatewayId: paymentIntent.id,
        gatewayData: {
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
        // Don't use redirect URL for PaymentIntent - use clientSecret instead
        redirectUrl: undefined,
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      return {
        success: false,
        paymentId: data.userId,
        error: error.message,
      };
    }
  }

  async verifyPayment(paymentId: string, data?: any): Promise<PaymentStatus> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Retrieve the PaymentIntent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      let status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
      
      switch (paymentIntent.status) {
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
          status = 'PENDING';
          break;
        case 'processing':
          status = 'PROCESSING';
          break;
        case 'succeeded':
          status = 'COMPLETED';
          break;
        case 'canceled':
          status = 'CANCELLED';
          break;
        default:
          status = 'FAILED';
      }

      return {
        status,
        gatewayId: paymentIntent.id,
        gatewayData: {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          last_payment_error: paymentIntent.last_payment_error,
        },
      };
    } catch (error) {
      console.error('Stripe payment verification error:', error);
      return {
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  async refundPayment(paymentId: string, amount: number, reason?: string): Promise<RefundResult> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Create a refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason ? 'requested_by_customer' : undefined,
        metadata: {
          reason: reason || 'Casino refund',
        },
      });

      let refundStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
      
      switch (refund.status) {
        case 'pending':
          refundStatus = 'PENDING';
          break;
        case 'succeeded':
          refundStatus = 'COMPLETED';
          break;
        case 'failed':
        case 'canceled':
          refundStatus = 'FAILED';
          break;
        default:
          refundStatus = 'PROCESSING';
      }

      return {
        success: refundStatus === 'COMPLETED',
        refundId: refund.id,
        gatewayRefundId: refund.id,
        amount: refund.amount / 100, // Convert back from cents
        status: refundStatus,
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        refundId: `refund_${Date.now()}`,
        amount,
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return await this.verifyPayment(paymentId);
  }
}
