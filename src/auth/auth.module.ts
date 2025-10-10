import { EmailService } from "./../common/services/email/email.service";
import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { BetterAuthController } from "./better-auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { SubscriptionModule } from "src/subscription/subscription.module";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    SubscriptionModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get("JWT_SECRET") ||
          "fallback-jwt-secret-for-development-only",
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [AuthController, BetterAuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
