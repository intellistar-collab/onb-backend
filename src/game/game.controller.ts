import { Controller, Post, Body, Get, UseGuards } from "@nestjs/common";
import { GameService } from "./game.service";
import { BetterAuthGuard } from "../auth/better-auth.guard";

interface SubmitScoreRequest {
  userId: string;
  score: number;
}

interface SubmitScoreResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Controller("pacman")
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post("scores")
  @UseGuards(BetterAuthGuard)
  async submitScore(
    @Body() body: SubmitScoreRequest,
  ): Promise<SubmitScoreResponse> {
    try {
      const { userId, score } = body;

      if (!userId || score === undefined) {
        return {
          success: false,
          message: "userId and score are required",
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const savedScore = await this.gameService.saveScore(
        userId,
        score,
        "game",
      );

      return {
        success: true,
        message: "Score submitted successfully",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: savedScore,
      };
    } catch (error) {
      console.error("Error submitting score:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to submit score",
      };
    }
  }

  @Get("scores")
  async getTopScores() {
    try {
      const scores = await this.gameService.getTopScores(10);
      return {
        success: true,
        data: scores,
      };
    } catch (error) {
      console.error("Error fetching scores:", error);
      return {
        success: false,
        message: "Failed to fetch scores",
      };
    }
  }
}
