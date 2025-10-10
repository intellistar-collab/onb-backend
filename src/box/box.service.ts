import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBoxDto } from "./dto/create-box.dto";
import { UpdateBoxDto } from "./dto/update-box.dto";
import { Decimal } from "@prisma/client/runtime/library";

// Define interfaces to avoid 'any' type warnings
interface Box {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  price: Decimal;
  imageUrl: string;
  backgroundImage: string;
  isActive: boolean;
  order: number;
  boxCategoryId: string;
  purchasedCount: number;
  totalRevenue: Decimal;
  totalPayout: Decimal;
  exchangeablePayout: Decimal;
  retainedProfitPercentage: Decimal;
  createdAt: Date;
  updatedAt: Date;
  items?: Item[];
}

interface Item {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: Decimal | null;
  percentage: Decimal;
  status: string;
  viewCount: number;
  clickCount: number;
  openedCount: number;
  purchasedCount: number;
  boxId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SpinResult {
  prize: {
    id: string;
    name: string;
    price: number;
    threshold: number;
  };
  financials: {
    totalRevenue: number;
    totalPayout: number;
    exchangeablePayout: number;
    retainedProfit: number;
    netProfit: number;
  };
  box: {
    id: string;
    title: string;
    price: number;
  };
}

@Injectable()
export class BoxService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBoxDto): Promise<Box> {
    return this.prisma.box.create({
      data: {
        ...data,
        price: data.price,
      },
    });
  }

  findAll(): Promise<Box[]> {
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

  findOne(id: string): Promise<Box | null> {
    return this.prisma.box.findUnique({
      where: { id },
      include: { category: true, items: true },
    });
  }

  update(id: string, data: UpdateBoxDto): Promise<Box> {
    return this.prisma.box.update({
      where: { id },
      data: {
        ...data,
        price: data.price,
      },
    });
  }

  remove(id: string): Promise<Box> {
    return this.prisma.box.delete({ where: { id } });
  }

  async spinBox(boxId: string): Promise<SpinResult> {
    // 1. Fetch box with items
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: { items: true },
    });

    if (!box || !box.items || box.items.length === 0) {
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
    let selected: {
      id: string;
      name: string;
      price: number;
      threshold: number;
    } = distribution[0];
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
