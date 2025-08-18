import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateItemDto) {
    return this.prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
        percentage: data.percentage
          ? new Prisma.Decimal(data.percentage)
          : new Prisma.Decimal(0),
        status: data.status,
        viewCount: data.viewCount ?? 0,
        clickCount: data.clickCount ?? 0,
        openedCount: data.openedCount ?? 0,
        purchasedCount: data.purchasedCount ?? 0,
        boxId: data.boxId,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    sortBy?: keyof Prisma.ItemOrderByWithRelationInput;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, any>;
  }) {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
      filters = {},
    } = params;

    const skip = (page - 1) * limit;

    const allowedFilterFields: (keyof Prisma.ItemWhereInput)[] = [
      "name",
      "description",
      "status",
      "boxId",
      "price",
      "percentage",
    ];

    const where: Prisma.ItemWhereInput = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedFilterFields.includes(key as keyof Prisma.ItemWhereInput)) {
        continue; // skip disallowed filters
      }

      if (["name", "description"].includes(key)) {
        where[key] = {
          contains: value,
          mode: "insensitive",
        };
      } else if (["price", "percentage"].includes(key)) {
        const num = parseFloat(value);
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
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { box: true },
    });
    if (!item) {
      throw new NotFoundException("Item not found");
    }
    return item;
  }

  async update(id: string, data: UpdateItemDto) {
    return this.prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
        percentage: data.percentage
          ? new Prisma.Decimal(data.percentage)
          : undefined,
        status: data.status,
        viewCount: data.viewCount,
        clickCount: data.clickCount,
        openedCount: data.openedCount,
        purchasedCount: data.purchasedCount,
        boxId: data.boxId,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.item.delete({
      where: { id },
    });
  }
}
