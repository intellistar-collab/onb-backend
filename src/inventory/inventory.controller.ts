/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { UpdateInventoryItemDto } from "./dto/update-inventory-item.dto";
import { BetterAuthGuard } from "../auth/better-auth.guard";

@Controller("api/inventory")
@UseGuards(BetterAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async createInventoryItem(
    @Request() req: any,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ) {
    const userId = req.user.id;
    return this.inventoryService.createInventoryItem(
      userId,
      createInventoryItemDto,
    );
  }

  @Get()
  async getInventoryItems(@Request() req: any) {
    const userId = req.user.id;
    return this.inventoryService.getInventoryItems(userId);
  }

  @Put(":id")
  async updateInventoryItem(
    @Request() req: any,
    @Param("id") id: string,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ) {
    const userId = req.user.id;
    return this.inventoryService.updateInventoryItem(
      userId,
      id,
      updateInventoryItemDto,
    );
  }

  @Put(":id/sell")
  async sellInventoryItem(@Request() req: any, @Param("id") id: string) {
    const userId = req.user.id;
    return this.inventoryService.sellInventoryItem(userId, id);
  }

  @Delete(":id")
  async deleteInventoryItem(@Request() req: any, @Param("id") id: string) {
    const userId = req.user.id;
    return this.inventoryService.deleteInventoryItem(userId, id);
  }

  @Post("add")
  async addToInventory(
    @Request() req: any,
    @Body() data: { itemId: string; boxId: string; status: string },
  ) {
    const userId = req.user.id;
    return this.inventoryService.addToInventory(userId, data);
  }
}
