import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { BoxCategoryService } from "./box-category.service";
import { CreateBoxCategoryDto } from "./dto/create-box-category.dto";
import { UpdateBoxCategoryDto } from "./dto/update-box-category.dto";

// Define BoxCategory interface to avoid 'any' type warnings
interface BoxCategory {
  id: string;
  name: string;
  description?: string | null;
  photo?: string | null;
  order: number;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Controller("box-categories")
export class BoxCategoryController {
  constructor(private readonly service: BoxCategoryService) {}

  @Post()
  create(@Body() dto: CreateBoxCategoryDto): Promise<BoxCategory> {
    return this.service.create(dto) as Promise<BoxCategory>;
  }

  @Get()
  findAll(): Promise<BoxCategory[]> {
    return this.service.findAll() as Promise<BoxCategory[]>;
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<BoxCategory | null> {
    return this.service.findOne(id) as Promise<BoxCategory | null>;
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateBoxCategoryDto,
  ): Promise<BoxCategory> {
    return this.service.update(id, dto) as Promise<BoxCategory>;
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<BoxCategory> {
    return this.service.remove(id) as Promise<BoxCategory>;
  }
}
