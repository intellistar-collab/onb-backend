import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, CreatePaymentData, PaymentResult, PaymentStatus, RefundResult } from './interfaces/payment.interface';
import { StripeProvider } from './providers/stripe.provider';
import { CoinbaseProvider } from './providers/coinbase.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { CreatePaymentDto, CreateCryptoPaymentDto, CreateFiatPaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { PaymentMethod, PaymentGateway, PaymentStatus as PrismaPaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private providers: Map<PaymentGateway, PaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private stripeProvider: StripeProvider,
    private coinbaseProvider: CoinbaseProvider,
    private paypalProvider: PayPalProvider,
    private cryptoProvider: CryptoProvider,
  ) {
    this.providers = new Map<PaymentGateway, PaymentProvider>([
      [PaymentGateway.STRIPE, this.stripeProvider],
      [PaymentGateway.PAYPAL, this.paypalProvider],
      [PaymentGateway.COINBASE_COMMERCE, this.coinbaseProvider],
      [PaymentGateway.MANUAL_CRYPTO, this.cryptoProvider],
    ]);
  }

  async createPayment(userId: string, dto: CreatePaymentDto): Promise<PaymentResult> {
    // Get user's wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('User wallet not found');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        walletId: wallet.id,
        amount: dto.amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        gateway: dto.gateway,
        description: dto.description,
        gatewayData: dto.metadata,
        status: PrismaPaymentStatus.PENDING,
      },
    });

    try {
      // Get the appropriate provider
      const provider = this.providers.get(dto.gateway);
      if (!provider) {
        throw new BadRequestException(`Unsupported payment gateway: ${dto.gateway}`);
      }

      // Create payment with provider
      const paymentData: CreatePaymentData = {
        amount: dto.amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        description: dto.description,
        metadata: dto.metadata,
        userId,
        walletId: wallet.id,
      };

      const result = await provider.createPayment(paymentData);

      // Update payment with provider data
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayId: result.gatewayId,
          gatewayData: result.gatewayData,
          cryptoAddress: result.address,
          expiresAt: result.expiresAt,
          status: result.success ? PrismaPaymentStatus.PROCESSING : PrismaPaymentStatus.FAILED,
        },
      });

      return {
        ...result,
        paymentId: payment.id,
      };
    } catch (error) {
      // Update payment status to failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PrismaPaymentStatus.FAILED,
          gatewayData: { error: error.message },
        },
      });

      throw error;
    }
  }

  async createCryptoPayment(userId: string, dto: CreateCryptoPaymentDto): Promise<PaymentResult> {
    // Generate crypto address
    const addressData = await this.cryptoProvider.generateAddress(dto.cryptoNetwork, userId);
    
    // Create payment with crypto address
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        walletId: (await this.prisma.wallet.findUnique({ where: { userId } }))!.id,
        amount: dto.amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        gateway: PaymentGateway.MANUAL_CRYPTO,
        description: dto.description,
        cryptoAddress: addressData.address,
        cryptoNetwork: dto.cryptoNetwork,
        requiredConfirmations: dto.requiredConfirmations || 1,
        status: PrismaPaymentStatus.PENDING,
        expiresAt: addressData.expiresAt,
      },
    });

    return {
      success: true,
      paymentId: payment.id,
      address: addressData.address,
      qrCode: addressData.qrCode,
      expiresAt: addressData.expiresAt,
    };
  }

  async verifyPayment(paymentId: string, dto?: VerifyPaymentDto): Promise<PaymentStatus> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const provider = this.providers.get(payment.gateway);
    if (!provider) {
      throw new BadRequestException(`Unsupported payment gateway: ${payment.gateway}`);
    }

    const status = await provider.verifyPayment(paymentId, dto?.transactionHash);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status.status as PrismaPaymentStatus,
        confirmations: status.confirmations,
        gatewayData: status.gatewayData,
        completedAt: status.status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // If payment is completed, update wallet balance
    if (status.status === 'COMPLETED' && payment.status !== PrismaPaymentStatus.COMPLETED) {
      await this.updateWalletBalance(payment.walletId, Number(payment.amount));
    }

    return status;
  }

  async refundPayment(paymentId: string, dto: RefundPaymentDto): Promise<RefundResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PrismaPaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const provider = this.providers.get(payment.gateway);
    if (!provider) {
      throw new BadRequestException(`Unsupported payment gateway: ${payment.gateway}`);
    }

    const refundResult = await provider.refundPayment(paymentId, dto.amount, dto.reason);

    // Create refund record
    await this.prisma.refund.create({
      data: {
        paymentId,
        amount: dto.amount,
        reason: dto.reason,
        status: refundResult.status as any,
        gatewayRefundId: refundResult.gatewayRefundId,
        gatewayData: { refundId: refundResult.refundId },
      },
    });

    // Update wallet balance if refund is successful
    if (refundResult.success) {
      await this.updateWalletBalance(payment.walletId, -dto.amount);
    }

    return refundResult;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const provider = this.providers.get(payment.gateway);
    if (!provider) {
      throw new BadRequestException(`Unsupported payment gateway: ${payment.gateway}`);
    }

    return await provider.getPaymentStatus(paymentId);
  }

  async getUserPayments(userId: string, limit: number = 10, offset: number = 0) {
    return await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        refunds: true,
      },
    });
  }

  private async updateWalletBalance(walletId: string, amount: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId,
          amount: Math.abs(amount),
          type: amount > 0 ? 'CREDIT' : 'DEBIT',
        },
      });
    });
  }
}
