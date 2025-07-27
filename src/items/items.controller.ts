import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ItemsService } from "./items.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { ApiQuery, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudflareService } from "src/common/services/email/cloudflare.service";
@ApiTags("Items")
@Controller("items")
export class ItemsController {
  constructor(
    private readonly service: ItemsService,
    private readonly cloudflareService: CloudflareService
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new item" })
  create(@Body() dto: CreateItemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get paginated list of items" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    example: 1,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    example: 10,
    description: "Items per page (default: 10)",
  })
  findAll(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10"
  ) {
    return this.service.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get item by ID" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update item by ID" })
  update(@Param("id") id: string, @Body() dto: UpdateItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete item by ID" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    const fileName = file.originalname;
    const imageUrl = await this.cloudflareService.uploadImage(
      file.buffer,
      fileName
    );
    return { imageUrl };
  }

  @Get("cloudflare-images/upload-url")
  async getUploadUrl() {
    const uploadUrl = await this.cloudflareService.generateDirectUploadUrl();
    return { uploadUrl };
  }
}
