import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PayPalWebhookService {
  private readonly logger = new Logger(PayPalWebhookService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleWebhook(
    payload: any,
    transmissionId: string,
    certId: string,
    transmissionSig: string,
    transmissionTime: string,
  ): Promise<void> {
    try {
      // Verify webhook signature (simplified - in production use PayPal's verification)
      const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
      if (!webhookId) {
        this.logger.warn('PayPal webhook ID not configured');
      }

      this.logger.log(`Received PayPal webhook: ${payload.event_type}`);

      // Handle different event types
      switch (payload.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(payload.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentDenied(payload.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePaymentRefunded(payload.resource);
          break;
        default:
          this.logger.log(`Unhandled PayPal event type: ${payload.event_type}`);
      }
    } catch (error) {
      this.logger.error('PayPal webhook processing failed:', error);
      throw error;
    }
  }

  private async handlePaymentCompleted(capture: any): Promise<void> {
    try {
      this.logger.log(`PayPal payment completed: ${capture.id}`);

      // Find the payment in our database
      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: capture.custom_id || capture.id },
        include: { user: true, wallet: true },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${capture.id}`);
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
            paypalEvent: 'PAYMENT.CAPTURE.COMPLETED',
            paypalCapture: capture,
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

      this.logger.log(`PayPal payment ${capture.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error handling PayPal payment completed: ${error.message}`);
    }
  }

  private async handlePaymentDenied(capture: any): Promise<void> {
    try {
      this.logger.log(`PayPal payment denied: ${capture.id}`);

      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: capture.custom_id || capture.id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${capture.id}`);
        return;
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayData: {
            ...payment.gatewayData as any,
            paypalEvent: 'PAYMENT.CAPTURE.DENIED',
            paypalCapture: capture,
          },
        },
      });

      this.logger.log(`PayPal payment ${capture.id} marked as denied`);
    } catch (error) {
      this.logger.error(`Error handling PayPal payment denied: ${error.message}`);
    }
  }

  private async handlePaymentRefunded(capture: any): Promise<void> {
    try {
      this.logger.log(`PayPal payment refunded: ${capture.id}`);

      const payment = await this.prisma.payment.findFirst({
        where: { gatewayId: capture.custom_id || capture.id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found in database: ${capture.id}`);
        return;
      }

      // Create refund record
      await this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: Number(capture.amount?.value || 0),
          reason: 'PayPal refund',
          status: 'COMPLETED',
          gatewayRefundId: capture.id,
          gatewayData: {
            paypalEvent: 'PAYMENT.CAPTURE.REFUNDED',
            paypalCapture: capture,
          },
        },
      });

      // Update wallet balance (subtract refunded amount)
      await this.updateWalletBalance(payment.walletId, -Number(capture.amount?.value || 0));

      this.logger.log(`PayPal refund ${capture.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error handling PayPal payment refunded: ${error.message}`);
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
