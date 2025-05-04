import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import * as dayjs from 'dayjs';
import { EmailService } from 'src/common/services/email/email.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendFollowupToVerifiedUsers() {
    console.log('sendFollowupToVerifiedUsers');
    const cutoff = dayjs().subtract(24, 'hour').toDate();

    const users = await this.prisma.subscription.findMany({
      where: {
        verified: true,
        verifiedAt: {
          lte: cutoff,
        },
        followUpEmailSent: false,
      },
    });

    for (const user of users) {
      try {
        await this.emailService.sendInviteEmail({
          text: `Hey ${user.username}, thanks for verifying. Invite friends and earn rewards!`,
          user: user.username,
          email: user.email,
        });

        this.logger.log(`Follow-up email sent to ${user.email}`);

        await this.prisma.subscription.update({
          where: { id: user.id },
          data: { followUpEmailSent: true },
        });
      } catch (error) {
        this.logger.error(`Failed to send email to ${user.email}`, error.stack);
      }
    }
  }
}
