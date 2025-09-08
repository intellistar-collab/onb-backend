import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBoxDto } from "./dto/create-box.dto";
import { UpdateBoxDto } from "./dto/update-box.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class BoxService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBoxDto) {
    return this.prisma.box.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
      },
    });
  }

  findAll() {
    return this.prisma.box.findMany({
      orderBy: { order: "asc" },
      include: {
        category: true,
        items: true,
        _count: {
          select: { items: true },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.box.findUnique({
      where: { id },
      include: { category: true, items: true },
    });
  }

  update(id: string, data: UpdateBoxDto) {
    return this.prisma.box.update({
      where: { id },
      data: {
        ...data,
        price: data.price ? new Prisma.Decimal(data.price) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.box.delete({ where: { id } });
  }

  async spinBox(boxId: string) {
    // 1. Fetch box with items
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: { items: true },
    });

    if (!box || box.items.length === 0) {
      throw new Error("Box not found or has no items");
    }

    // 2. Build cumulative distribution
    let cumulative = 0;
    const distribution = box.items.map((item) => {
      cumulative += Number(item.percentage);
      return {
        id: item.id,
        name: item.name,
        price: Number(item.price ?? 0),
        threshold: cumulative,
      };
    });
    const totalWeight = cumulative;

    // 3. Pick a random item
    const r = Math.random() * totalWeight;
    let selected = distribution[0];
    for (const item of distribution) {
      if (r < item.threshold) {
        selected = item;
        break;
      }
    }

    // 4. Determine financial values
    const boxPrice = Number(box.price); // cost to play
    const prizeValue = selected.price;
    const isExchangeable = this.isExchangeable(selected.name);

    const newTotalRevenue = Number(box.totalRevenue) + boxPrice;
    const newTotalPayout = Number(box.totalPayout) + prizeValue;
    const newExchangeablePayout =
      Number(box.exchangeablePayout) + (isExchangeable ? prizeValue : 0);

    const retainedProfit =
      newExchangeablePayout * Number(box.retainedProfitPercentage);
    const netProfit = newTotalRevenue - newTotalPayout + retainedProfit;

    // 5. Update DB
    await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id: selected.id },
        data: {
          purchasedCount: { increment: 1 },
        },
      }),
      this.prisma.box.update({
        where: { id: boxId },
        data: {
          purchasedCount: { increment: 1 },
          totalRevenue: newTotalRevenue,
          totalPayout: newTotalPayout,
          exchangeablePayout: newExchangeablePayout,
        },
      }),
    ]);

    // 6. Return result
    return {
      prize: selected,
      financials: {
        totalRevenue: newTotalRevenue,
        totalPayout: newTotalPayout,
        exchangeablePayout: newExchangeablePayout,
        retainedProfit,
        netProfit,
      },
      box: {
        id: box.id,
        title: box.title,
        price: boxPrice,
      },
    };
  }

  // === PYTHON LOGIC: "exchangeable_items" were only items <= 17
  private isExchangeable(itemName: string): boolean {
    try {
      const num = parseInt(itemName.split(" ")[1], 10);
      return num <= 17; // same as Python condition
    } catch {
      return false;
    }
  }
}
