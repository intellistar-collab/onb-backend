import { Injectable } from "@nestjs/common";
import Mailgun from "mailgun.js";
import { PrismaService } from "src/prisma/prisma.service";
import * as FormData from "form-data";
import { randomBytes } from "crypto";

// Using Prisma generated types instead of custom interface

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async findUserById(userId: string): Promise<{
    id: string;
    email: string;
    username: string;
  } | null> {
    return await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
  }

  async saveScore(
    userId: string,
    score: number,
    source: string = "game",
  ): Promise<any> {
    // Verify user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Create score with new schema using Prisma client
    const savedScore = await this.prisma.score.create({
      data: {
        userId: userId,
        score: score,
        source: source,
      },
    });

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { email: user.email },
    });

    if (!existingSubscription) {
      // If not subscribed, subscribe them
      const verificationToken = randomBytes(32).toString("hex");
      const subscription = await this.prisma.subscription.create({
        data: { email: user.email, username: user.username, verificationToken },
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
        const data = await client.messages.create(
          process.env.MAILGUN_DOMAIN || "onenightbox.com",
          {
            from:
              process.env.EMAIL_FROM || "ONB Team <postmaster@onenightbox.com>",
            to: [subscription.email],
            subject: "Email Confirmation",
            template: "email confirm",
            "h:X-Mailgun-Variables": JSON.stringify({
              email: subscription.email,
              url: process.env.FRONTEND_URL,
              verificationToken: subscription.verificationToken,
              username: subscription.username,
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
    return savedScore;
  }

  async getTopScores(limit = 10): Promise<any[]> {
    return await this.prisma.score.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { score: "desc" },
      take: limit,
    });
  }
}
