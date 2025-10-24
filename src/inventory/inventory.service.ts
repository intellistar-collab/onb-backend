/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
    const existingItem = await this.prisma.inventoryItem.findFirst({
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
    const inventoryItem = await this.prisma.inventoryItem.create({
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
      itemTier: "common", // Default tier since it's not in the schema
      itemOdds: "0%", // Default odds since it's not in the schema
      boxId: inventoryItem.boxId,
      boxTitle: inventoryItem.box.title,
      status: inventoryItem.status,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
    };
  }

  async getInventoryItems(userId: string) {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
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
        itemTier: "common", // Default tier since it's not in the schema
        itemOdds: "0%", // Default odds since it's not in the schema
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
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
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

    const updatedItem = await this.prisma.inventoryItem.update({
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
      itemTier: "common", // Default tier since it's not in the schema
      itemOdds: "0%", // Default odds since it's not in the schema
      boxId: updatedItem.boxId,
      boxTitle: updatedItem.box.title,
      status: updatedItem.status,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    };
  }

  async sellInventoryItem(userId: string, itemId: string) {
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
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
      const updatedInventoryItem = await tx.inventoryItem.update({
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
            increment: Number(inventoryItem.item.price) || 0,
          },
        },
      });

      return updatedInventoryItem;
    });

    return {
      success: true,
      message: `Item sold for $${Number(inventoryItem.item.price).toFixed(2)}`,
      item: {
        id: result.id,
        itemName: result.item.name,
        itemPrice: result.item.price,
      },
    };
  }

  async deleteInventoryItem(userId: string, itemId: string) {
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Inventory item not found");
    }

    await this.prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    return {
      success: true,
      message: "Inventory item deleted successfully",
    };
  }

  async addToInventory(
    userId: string,
    data: { itemId: string; boxId: string; status: string },
  ) {
    // Verify that the item and box exist
    const item = await this.prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    const box = await this.prisma.box.findUnique({
      where: { id: data.boxId },
    });

    if (!box) {
      throw new NotFoundException("Box not found");
    }

    // Get user's wallet for transaction (only needed for SOLD status)
    let user: any = null;
    if (data.status === "SOLD") {
      user = await this.prisma.users.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || !user.wallet) {
        throw new BadRequestException("User wallet not found");
      }
    }

    // Execute transaction based on status
    const result = await this.prisma.$transaction(async (tx) => {
      // Create inventory item
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          userId,
          itemId: data.itemId,
          boxId: data.boxId,
          status: data.status,
        },
        include: {
          item: true,
          box: true,
        },
      });

      // If status is SOLD, add money to wallet and create transaction
      if (data.status === "SOLD" && user && user.wallet) {
        const itemPrice = Number(item.price);

        // Add item price to user's wallet
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: {
              increment: itemPrice,
            },
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: itemPrice,
            type: "CREDIT",
          },
        });

        // Update item statistics
        await tx.item.update({
          where: { id: data.itemId },
          data: {
            purchasedCount: { increment: 1 },
          },
        });
      }

      return inventoryItem;
    });

    return {
      success: true,
      message:
        data.status === "SOLD"
          ? `Item sold for $${Number(item.price).toFixed(2)}`
          : "Item added to inventory",
      item: {
        id: result.id,
        itemName: result.item.name,
        itemPrice: result.item.price,
        status: result.status,
      },
    };
  }
}
