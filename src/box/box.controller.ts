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

// Define Box interface to avoid 'any' type warnings
interface Box {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  price: number;
  imageUrl: string;
  backgroundImage: string;
  isActive: boolean;
  order: number;
  boxCategoryId: string;
  purchasedCount: number;
  totalRevenue: number;
  totalPayout: number;
  exchangeablePayout: number;
  retainedProfitPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

@Controller("boxes")
export class BoxController {
  constructor(private readonly service: BoxService) {}

  @Post()
  create(@Body() dto: CreateBoxDto): Promise<Box> {
    return this.service.create(dto) as Promise<Box>;
  }

  @Get()
  findAll(): Promise<Box[]> {
    return this.service.findAll() as Promise<Box[]>;
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Box | null> {
    return this.service.findOne(id) as Promise<Box | null>;
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBoxDto): Promise<Box> {
    return this.service.update(id, dto) as Promise<Box>;
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<Box> {
    return this.service.remove(id) as Promise<Box>;
  }

  @Post(":id/spin")
  async spinBox(@Param("id") id: string): Promise<any> {
    return this.service.spinBox(id);
  }
}
