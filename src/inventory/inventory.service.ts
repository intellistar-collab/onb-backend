/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "./dto/update-inventory-item.dto";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createInventoryItem(
    userId: string,
    createInventoryItemDto: CreateInventoryItemDto,
  ) {
    // Verify that the item and box exist
    const item = await this.prisma.item.findUnique({
      where: { id: createInventoryItemDto.itemId },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    const box = await this.prisma.box.findUnique({
      where: { id: createInventoryItemDto.boxId },
    });

    if (!box) {
      throw new NotFoundException("Box not found");
    }

    // Check if user already has this item in inventory
    const existingItem = await (this.prisma as any).inventoryItem.findFirst({
      where: {
        userId,
        itemId: createInventoryItemDto.itemId,
        status: "KEPT",
      },
    });

    if (existingItem) {
      throw new BadRequestException("Item already exists in inventory");
    }

    // Create inventory item
    const inventoryItem = await (this.prisma as any).inventoryItem.create({
      data: {
        userId,
        itemId: createInventoryItemDto.itemId,
        boxId: createInventoryItemDto.boxId,
        status: createInventoryItemDto.status,
      },
      include: {
        item: true,
        box: true,
      },
    });

    return {
      id: inventoryItem.id,
      userId: inventoryItem.userId,
      itemId: inventoryItem.itemId,
      itemName: inventoryItem.item.name,
      itemImage: inventoryItem.item.imageUrl,
      itemPrice: inventoryItem.item.price,
      itemTier: inventoryItem.item.tier || "common",
      itemOdds: inventoryItem.item.odds,
      boxId: inventoryItem.boxId,
      boxTitle: inventoryItem.box.title,
      status: inventoryItem.status,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
    };
  }

  async getInventoryItems(userId: string) {
    const inventoryItems = await (this.prisma as any).inventoryItem.findMany({
      where: { userId },
      include: {
        item: true,
        box: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      items: inventoryItems.map((item) => ({
        id: item.id,
        userId: item.userId,
        itemId: item.itemId,
        itemName: item.item.name,
        itemImage: item.item.imageUrl,
        itemPrice: item.item.price,
        itemTier: item.item.tier || "common",
        itemOdds: item.item.odds,
        boxId: item.boxId,
        boxTitle: item.box.title,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    };
  }

  async updateInventoryItem(
    userId: string,
    itemId: string,
    updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    const inventoryItem = await (this.prisma as any).inventoryItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
      include: {
        item: true,
        box: true,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Inventory item not found");
    }

    const updatedItem = await (this.prisma as any).inventoryItem.update({
      where: { id: itemId },
      data: updateInventoryItemDto,
      include: {
        item: true,
        box: true,
      },
    });

    return {
      id: updatedItem.id,
      userId: updatedItem.userId,
      itemId: updatedItem.itemId,
      itemName: updatedItem.item.name,
      itemImage: updatedItem.item.imageUrl,
      itemPrice: updatedItem.item.price,
      itemTier: updatedItem.item.tier || "common",
      itemOdds: updatedItem.item.odds,
      boxId: updatedItem.boxId,
      boxTitle: updatedItem.box.title,
      status: updatedItem.status,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    };
  }

  async sellInventoryItem(userId: string, itemId: string) {
    const inventoryItem = await (this.prisma as any).inventoryItem.findFirst({
      where: {
        id: itemId,
        userId,
        status: "KEPT",
      },
      include: {
        item: true,
        user: true,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Inventory item not found or already sold");
    }

    // Start a transaction to update inventory item and user wallet
    const result = await this.prisma.$transaction(async (tx) => {
      // Update inventory item status to SOLD
      const updatedInventoryItem = await (tx as any).inventoryItem.update({
        where: { id: itemId },
        data: { status: "SOLD" },
        include: {
          item: true,
          box: true,
        },
      });

      // Add item price to user's wallet balance
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: inventoryItem.item.price,
          },
        },
      });

      return updatedInventoryItem;
    });

    return {
      success: true,
      message: `Item sold for $${inventoryItem.item.price}`,
      item: {
        id: result.id,
        itemName: result.item.name,
        itemPrice: result.item.price,
      },
    };
  }

  async deleteInventoryItem(userId: string, itemId: string) {
    const inventoryItem = await (this.prisma as any).inventoryItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Inventory item not found");
    }

    await (this.prisma as any).inventoryItem.delete({
      where: { id: itemId },
    });

    return {
      success: true,
      message: "Inventory item deleted successfully",
    };
  }
}
