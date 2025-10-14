import { Decimal } from "@prisma/client/runtime/library";

export class WalletDto {
  id: string;
  balance: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export class ScoreDto {
  id: number;
  score: number;
  source: string;
  createdAt: Date;
}

export class WalletScoreResponseDto {
  wallet: WalletDto;
  score: ScoreDto;
}
