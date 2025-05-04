import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailService } from 'src/common/services/email/email.service';
import { SubscriptionCronService } from './subscription-cron/subscription-cron.service';

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionService, EmailService, SubscriptionCronService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
