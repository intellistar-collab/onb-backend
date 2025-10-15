import { Module, forwardRef } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameController } from "./game.controller";
import { GameGateway } from "./game.gateway";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [GameService, GameGateway, PrismaService],
  controllers: [GameController],
})
export class GameModule {}
