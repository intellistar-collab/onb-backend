import { Controller, Post, Req, Res, Headers, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';
import { PayPalWebhookService } from './paypal-webhook.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private stripeWebhookService: StripeWebhookService,
    private paypalWebhookService: PayPalWebhookService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    try {
      await this.stripeWebhookService.handleWebhook(req.body, signature);
      res.status(200).json({ received: true });
    } catch (error) {
      this.logger.error('Stripe webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  @Post('paypal')
  async handlePayPalWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-cert-id') certId: string,
    @Headers('paypal-transmission-sig') transmissionSig: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
  ): Promise<void> {
    try {
      await this.paypalWebhookService.handleWebhook(
        req.body,
        transmissionId,
        certId,
        transmissionSig,
        transmissionTime,
      );
      res.status(200).json({ received: true });
    } catch (error) {
      this.logger.error('PayPal webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
