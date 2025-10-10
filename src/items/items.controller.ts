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

// Define interfaces for type safety
interface CloudflareUploadResult {
  id: string;
  uploadURL: string;
}

interface UploadResponse {
  uploadUrl: CloudflareUploadResult;
}

interface ImageUploadResponse {
  imageUrl: string;
}

// Define Item interface to match service
interface Item {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  percentage: number;
  status: string;
  viewCount: number;
  clickCount: number;
  openedCount: number;
  purchasedCount: number;
  boxId: string;
  createdAt: Date;
  updatedAt: Date;
  box?: any;
}

// Define PaginatedResponse interface to match service
interface PaginatedResponse {
  data: Item[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
@ApiTags("Items")
@Controller("items")
export class ItemsController {
  constructor(
    private readonly service: ItemsService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new item" })
  create(@Body() dto: CreateItemDto): Promise<Item> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "Get paginated, filtered, and sorted list of items",
  })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: String,
    example: "createdAt",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    type: String,
    example: "desc",
  })

  // Supported filters
  @ApiQuery({
    name: "name",
    required: false,
    type: String,
    description: "Partial match for item name",
  })
  @ApiQuery({
    name: "description",
    required: false,
    type: String,
    description: "Partial match for description",
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Item status filter",
  })
  @ApiQuery({
    name: "boxId",
    required: false,
    type: String,
    description: "Box ID filter",
  })
  @ApiQuery({
    name: "price",
    required: false,
    type: Number,
    description: "Exact price match",
  })
  @ApiQuery({
    name: "percentage",
    required: false,
    type: Number,
    description: "Exact percentage match",
  })
  findAll(@Query() query: Record<string, any>): Promise<PaginatedResponse> {
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "price",
      "name",
      "description",
      "status",
      "percentage",
    ] as const;

    const page = parseInt((query.page as string) || "1", 10);
    const limit = parseInt((query.limit as string) || "10", 10);

    const sortBy =
      query.sortBy &&
      typeof query.sortBy === "string" &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      allowedSortFields.includes(query.sortBy as any)
        ? query.sortBy
        : "createdAt";

    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    // Strip pagination and sorting to get only filters
    const filters: Record<string, any> = { ...query };
    delete filters.page;
    delete filters.limit;
    delete filters.sortBy;
    delete filters.sortOrder;

    return this.service.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      filters,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get item by ID" })
  findOne(@Param("id") id: string): Promise<Item> {
    return this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update item by ID" })
  update(@Param("id") id: string, @Body() dto: UpdateItemDto): Promise<Item> {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete item by ID" })
  remove(@Param("id") id: string): Promise<Item> {
    return this.service.remove(id);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageUploadResponse> {
    console.log(file);
    const fileName = file.originalname;
    const imageUrl = await this.cloudflareService.uploadImage(
      file.buffer,
      fileName,
    );
    return { imageUrl };
  }

  @Get("cloudflare-images/upload-url")
  async getUploadUrl(): Promise<UploadResponse> {
    const uploadUrl = await this.cloudflareService.generateDirectUploadUrl();
    return { uploadUrl };
  }
}
