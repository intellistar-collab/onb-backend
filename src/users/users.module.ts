import { SubscriptionService } from "./../subscription/subscription.service";
import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersController } from "./users.controller";
import { EmailService } from "src/common/services/email/email.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, EmailService, SubscriptionService],
  exports: [UsersService],
})
export class UsersModule {}
