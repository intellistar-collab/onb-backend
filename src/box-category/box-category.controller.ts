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

@Controller("box-categories")
export class BoxCategoryController {
  constructor(private readonly service: BoxCategoryService) {}

  @Post()
  create(@Body() dto: CreateBoxCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBoxCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
