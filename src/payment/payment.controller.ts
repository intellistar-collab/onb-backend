import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, CreateCryptoPaymentDto, CreateFiatPaymentDto, VerifyPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { BetterAuthGuard } from '../auth/better-auth.guard';

@Controller('payments')
@UseGuards(BetterAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    return await this.paymentService.createPayment(req.user.id, dto);
  }

  @Post('create/crypto')
  async createCryptoPayment(@Request() req, @Body() dto: CreateCryptoPaymentDto) {
    return await this.paymentService.createCryptoPayment(req.user.id, dto);
  }

  @Post('create/fiat')
  async createFiatPayment(@Request() req, @Body() dto: CreateFiatPaymentDto) {
    return await this.paymentService.createPayment(req.user.id, dto);
  }

  @Post(':id/verify')
  async verifyPayment(@Param('id') paymentId: string, @Body() dto: VerifyPaymentDto) {
    return await this.paymentService.verifyPayment(paymentId, dto);
  }

  @Post(':id/refund')
  async refundPayment(@Param('id') paymentId: string, @Body() dto: RefundPaymentDto) {
    return await this.paymentService.refundPayment(paymentId, dto);
  }

  @Get(':id/status')
  async getPaymentStatus(@Param('id') paymentId: string) {
    return await this.paymentService.getPaymentStatus(paymentId);
  }

  @Get('history')
  async getUserPayments(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    return await this.paymentService.getUserPayments(req.user.id, limitNum, offsetNum);
  }

  @Get('methods')
  async getSupportedPaymentMethods() {
    return {
      fiat: [
        { method: 'CREDIT_CARD', gateway: 'STRIPE', name: 'Credit Card' },
        { method: 'DEBIT_CARD', gateway: 'STRIPE', name: 'Debit Card' },
        { method: 'PAYPAL', gateway: 'PAYPAL', name: 'PayPal' },
        { method: 'APPLE_PAY', gateway: 'STRIPE', name: 'Apple Pay' },
        { method: 'GOOGLE_PAY', gateway: 'STRIPE', name: 'Google Pay' },
      ],
      crypto: [
        { method: 'BITCOIN', gateway: 'MANUAL_CRYPTO', name: 'Bitcoin', network: 'Bitcoin' },
        { method: 'ETHEREUM', gateway: 'MANUAL_CRYPTO', name: 'Ethereum', network: 'Ethereum' },
        { method: 'USDT', gateway: 'MANUAL_CRYPTO', name: 'Tether', network: 'Tron' },
        { method: 'USDC', gateway: 'MANUAL_CRYPTO', name: 'USD Coin', network: 'Ethereum' },
        { method: 'LITECOIN', gateway: 'MANUAL_CRYPTO', name: 'Litecoin', network: 'Litecoin' },
      ],
    };
  }
}
