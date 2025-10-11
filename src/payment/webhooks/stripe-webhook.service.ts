import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover',
      });
    }
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

      // Find the payment in our database
      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: paymentIntent.id },
        include: { user: true, wallet: true },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${paymentIntent.id}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          gatewayData: {
            ...payment.gatewayData as any,
            stripeEvent: 'payment_intent.succeeded',
            stripePaymentIntent: paymentIntent,
          },
        },
      });

      // Update wallet balance
      await this.updateWalletBalance(payment.walletId, Number(payment.amount));

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          walletId: payment.walletId,
          amount: Number(payment.amount),
          type: 'CREDIT',
        },
      });

      this.logger.log(`Payment ${paymentIntent.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error handling payment succeeded: ${error.message}`);
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment failed: ${paymentIntent.id}`);

      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: paymentIntent.id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${paymentIntent.id}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayData: {
            ...payment.gatewayData as any,
            stripeEvent: 'payment_intent.payment_failed',
            stripePaymentIntent: paymentIntent,
            error: paymentIntent.last_payment_error,
          },
        },
      });

      this.logger.log(`Payment ${paymentIntent.id} marked as failed`);
    } catch (error) {
      this.logger.error(`Error handling payment failed: ${error.message}`);
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment canceled: ${paymentIntent.id}`);

      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: paymentIntent.id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${paymentIntent.id}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          gatewayData: {
            ...payment.gatewayData as any,
            stripeEvent: 'payment_intent.canceled',
            stripePaymentIntent: paymentIntent,
          },
        },
      });

      this.logger.log(`Payment ${paymentIntent.id} marked as canceled`);
    } catch (error) {
      this.logger.error(`Error handling payment canceled: ${error.message}`);
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      this.logger.log(`Dispute created: ${dispute.id}`);

      // Find the payment associated with this charge
      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: dispute.payment_intent as string },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for dispute: ${dispute.id}`);
        return;
      }

      // Update payment with dispute information
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayData: {
            ...payment.gatewayData as any,
            stripeEvent: 'charge.dispute.created',
            dispute: dispute,
          },
        },
      });

      this.logger.log(`Dispute ${dispute.id} recorded for payment ${payment.id}`);
    } catch (error) {
      this.logger.error(`Error handling dispute created: ${error.message}`);
    }
  }

  private async updateWalletBalance(walletId: string, amount: number): Promise<void> {
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }
}
