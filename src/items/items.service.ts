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

  async findAll(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { box: true },
      }),
      this.prisma.item.count(),
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
