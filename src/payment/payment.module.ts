import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StripeProvider } from './providers/stripe.provider';
import { CoinbaseProvider } from './providers/coinbase.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { CryptoProvider } from './providers/crypto.provider';
import { WebhookController } from './webhooks/webhook.controller';
import { StripeWebhookService } from './webhooks/stripe-webhook.service';
import { PayPalWebhookService } from './webhooks/paypal-webhook.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), forwardRef(() => UsersModule)],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    StripeProvider,
    CoinbaseProvider,
    PayPalProvider,
    CryptoProvider,
    StripeWebhookService,
    PayPalWebhookService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
