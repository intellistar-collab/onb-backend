import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

// Define interfaces for type safety
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

interface PaginatedResponse {
  data: Item[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateItemDto): Promise<Item> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (await this.prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        percentage: data.percentage ?? 0,
        status: data.status,
        viewCount: data.viewCount ?? 0,
        clickCount: data.clickCount ?? 0,
        openedCount: data.openedCount ?? 0,
        purchasedCount: data.purchasedCount ?? 0,
        boxId: data.boxId,
      },
    })) as Item;
  }

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  async findAll(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, any>;
  }): Promise<PaginatedResponse> {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = params;

    const skip = (page - 1) * limit;

    const allowedFilterFields: string[] = [
      "name",
      "description",
      "status",
      "boxId",
      "price",
      "percentage",
    ];

    const where: any = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedFilterFields.includes(key)) {
        continue; // skip disallowed filters
      }

      if (["name", "description"].includes(key)) {
        where[key] = {
          contains: value,
          mode: "insensitive",
        };
      } else if (["price", "percentage"].includes(key)) {
        const num = parseFloat(value as string);
        if (!isNaN(num)) {
          where[key] = num;
        }
      } else {
        where[key] = value; // for status and boxId
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: { box: true },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items as Item[],
      meta: {
        total: total as number,
        page,
        limit,
        totalPages: Math.ceil((total as number) / limit),
      },
    };
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  }

  async findOne(id: string): Promise<Item> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { box: true },
    });
    if (!item) {
      throw new NotFoundException("Item not found");
    }
    return item as Item;
  }

  async update(id: string, data: UpdateItemDto): Promise<Item> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (await this.prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        percentage: data.percentage,
        status: data.status,
        viewCount: data.viewCount,
        clickCount: data.clickCount,
        openedCount: data.openedCount,
        purchasedCount: data.purchasedCount,
        boxId: data.boxId,
      },
    })) as Item;
  }

  async remove(id: string): Promise<Item> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (await this.prisma.item.delete({
      where: { id },
    })) as Item;
  }
}
