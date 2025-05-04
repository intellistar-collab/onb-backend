import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async saveScore(name: string, email: string, score: number) {
    const savedScore = this.prisma.score.create({
      data: { name, email, score },
    });

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { email },
    });

    if (!existingSubscription) {
      // If not subscribed, subscribe them
      await this.prisma.subscription.create({
        data: { email, username: name },
      });
    }
    return savedScore;
  }

  async getTopScores(limit = 3) {
    return this.prisma.score.findMany({
      orderBy: { score: 'desc' },
      take: limit,
    });
  }
}
