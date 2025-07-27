import { Module } from "@nestjs/common";
import { CloudflareService } from "src/common/services/email/cloudflare.service";
import { PrismaModule } from "src/prisma/prisma.module";
import { ItemsController } from "./items.controller";
import { ItemsService } from "./items.service";

@Module({
  imports: [PrismaModule],
  controllers: [ItemsController],
  providers: [ItemsService, CloudflareService],
})
export class ItemsModule {}
