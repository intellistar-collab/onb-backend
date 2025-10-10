import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";

// Define interfaces for type safety
interface Subscription {
  id: string;
  email: string;
  username: string;
  verificationToken?: string | null;
  verified: boolean;
  verifiedAt?: Date | null;
  referrerEmail?: string | null;
  points?: number;
  followUpEmailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionResponse {
  message: string;
  data?: Subscription;
}

interface FindOneResponse {
  existing: Subscription | null;
}

interface PaginatedResponse {
  total: number;
  data: Subscription[];
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const { email, username, referrerEmail } = dto;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const existing = await this.prisma.subscription.findUnique({
        where: { email },
      });

      if (existing) {
        throw new ConflictException("Email already subscribed");
      }
      const verificationToken = randomBytes(32).toString("hex");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return (await this.prisma.subscription.create({
        data: {
          email,
          username,
          verificationToken,
          referrerEmail,
        },
      })) as Subscription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : "Unknown error";
      this.logger.error(
        `Subscription creation failed for ${email}`,
        errorMessage,
      );
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException("Failed to create subscription");
    }
  }

  async findOne(referrerEmail: string): Promise<FindOneResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const existing = await this.prisma.subscription.findUnique({
        where: { email: referrerEmail },
      });
      return {
        existing: existing as Subscription | null,
      };
    } catch (error: unknown) {
      console.log(error);
      return { existing: null };
    }
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const [total, data] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.prisma.subscription.count(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.prisma.subscription.findMany({
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        total: total as number,
        data: data as Subscription[],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack : "Unknown error";
      this.logger.error("Failed to retrieve subscriptions", errorMessage);
      throw new InternalServerErrorException("Failed to fetch subscriptions");
    }
  }

  async findAllUnpaginated(): Promise<Subscription[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return (await this.prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
      })) as Subscription[];
    } catch {
      throw new InternalServerErrorException("Failed to fetch subscriptions");
    }
  }

  async verifySubscription(token: string): Promise<SubscriptionResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const subscription = (await this.prisma.subscription.findFirst({
        where: {
          verificationToken: token,
        },
      })) as Subscription | null;

      if (!subscription) {
        throw new ConflictException("Invalid or expired verification token");
      }

      if (subscription.verified) {
        return { message: "Email already verified" };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const updated = (await this.prisma.subscription.update({
        where: { email: subscription.email },
        data: {
          verified: true,
          verificationToken: null,
          verifiedAt: new Date(),
        },
      })) as Subscription;

      // If referrer exists and is verified, reward them with 1 point
      if (updated.referrerEmail) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await this.prisma.subscription.updateMany({
          where: { email: updated.referrerEmail },
          data: { points: { increment: 1 } },
        });
      }
      return { message: "Email verified successfully", data: updated };
    } catch (error: unknown) {
      console.log(error);
      throw new InternalServerErrorException("Verification failed");
    }
  }
}
