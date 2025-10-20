import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { BoxController } from "./box.controller";
import { BoxService } from "./box.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [BoxController],
  providers: [BoxService],
})
export class BoxModule {}
