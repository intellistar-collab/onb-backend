import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { BoxCategoryController } from "./box-category.controller";
import { BoxCategoryService } from "./box-category.service";

@Module({
  imports: [PrismaModule],
  controllers: [BoxCategoryController],
  providers: [BoxCategoryService],
})
export class BoxCategoryModule {}
