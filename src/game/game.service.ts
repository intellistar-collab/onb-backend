import { Injectable } from "@nestjs/common";
import Mailgun from "mailgun.js";
import { PrismaService } from "src/prisma/prisma.service";
import * as FormData from "form-data";
import { randomBytes } from "crypto";

// Define interfaces for type safety
interface Score {
  id: string;
  name: string;
  email: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Subscription {
  id: string;
  email: string;
  username: string;
  verificationToken: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async saveScore(name: string, email: string, score: number): Promise<Score> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const savedScore = await this.prisma.score.create({
      data: { name, email, score },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { email },
    });

    if (!existingSubscription) {
      // If not subscribed, subscribe them
      const verificationToken = randomBytes(32).toString("hex");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const subscription = await this.prisma.subscription.create({
        data: { email, username: name, verificationToken },
      });

      const mg = new Mailgun(FormData);

      const client = mg.client({
        username: "api",
        key:
          process.env.MAILGUN_API_KEY ||
          "d4c1ee832068e4163645e058c1b46841-a908eefc-70896736",
        url: "https://api.eu.mailgun.net",
      });

      try {
        const subscriptionData = subscription as Subscription;
        const data = await client.messages.create(
          process.env.MAILGUN_DOMAIN || "onenightbox.com",
          {
            from:
              process.env.EMAIL_FROM || "ONB Team <postmaster@onenightbox.com>",
            to: [subscriptionData.email],
            subject: "Email Confirmation",
            template: "email confirm",
            "h:X-Mailgun-Variables": JSON.stringify({
              email: subscriptionData.email,
              url: process.env.FRONTEND_URL,
              verificationToken: subscriptionData.verificationToken,
              username: subscriptionData.username,
            }),
          },
        );

        console.log(data);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log("Email sending error:", errorMessage);
      }
    }
    return savedScore as Score;
  }

  async getTopScores(limit = 10): Promise<Score[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (await this.prisma.score.findMany({
      orderBy: { score: "desc" },
      take: limit,
    })) as Score[];
  }
}
