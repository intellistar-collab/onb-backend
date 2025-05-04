import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    const { email, username, referrerEmail } = dto;

    try {
      const existing = await this.prisma.subscription.findUnique({
        where: { email },
      });

      if (existing) {
        throw new ConflictException('Email already subscribed');
      }
      const verificationToken = randomBytes(32).toString('hex');

      return await this.prisma.subscription.create({
        data: {
          email,
          username,
          verificationToken,
          referrerEmail,
        },
      });
    } catch (error) {
      this.logger.error(`Subscription creation failed for ${email}`, error.stack);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('Failed to create subscription');
    }
  }

  async findOne(referrerEmail: string) {
    try {
      const existing = await this.prisma.subscription.findUnique({
        where: { email: referrerEmail },
      });
      return {
        existing,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(page = 1, limit = 10) {
    try {
      const [total, data] = await Promise.all([
        this.prisma.subscription.count(),
        this.prisma.subscription.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        total,
        data,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve subscriptions', error.stack);
      throw new InternalServerErrorException('Failed to fetch subscriptions');
    }
  }

  async findAllUnpaginated() {
    try {
      return await this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch subscriptions');
    }
  }

  async verifySubscription(token: string) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          verificationToken: token,
        },
      });

      if (!subscription) {
        throw new ConflictException('Invalid or expired verification token');
      }

      if (subscription.verified) {
        return { message: 'Email already verified' };
      }

      const updated = await this.prisma.subscription.update({
        where: { email: subscription.email },
        data: {
          verified: true,
          verificationToken: null,
          verifiedAt: new Date(),
        },
      });

      // If referrer exists and is verified, reward them with 1 point
      if (updated.referrerEmail) {
        await this.prisma.subscription.updateMany({
          where: { email: updated.referrerEmail },
          data: { points: { increment: 1 } },
        });
      }
      return { message: 'Email verified successfully', data: updated };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Verification failed');
    }
  }
}
