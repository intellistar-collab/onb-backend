import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { BoxService } from "./box.service";
import { CreateBoxDto } from "./dto/create-box.dto";
import { UpdateBoxDto } from "./dto/update-box.dto";
import { Decimal } from "@prisma/client/runtime/library";

// Define Box interface to match service
interface Box {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  price: Decimal;
  imageUrl: string;
  backgroundImage: string;
  isActive: boolean;
  order: number;
  boxCategoryId: string;
  purchasedCount: number;
  totalRevenue: Decimal;
  totalPayout: Decimal;
  exchangeablePayout: Decimal;
  retainedProfitPercentage: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

@Controller("boxes")
export class BoxController {
  constructor(private readonly service: BoxService) {}

  @Post()
  create(@Body() dto: CreateBoxDto): Promise<Box> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Box[]> {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Box | null> {
    return this.service.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBoxDto): Promise<Box> {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<Box> {
    return this.service.remove(id);
  }

  @Post(":id/spin")
  async spinBox(@Param("id") id: string): Promise<any> {
    return this.service.spinBox(id);
  }
}
