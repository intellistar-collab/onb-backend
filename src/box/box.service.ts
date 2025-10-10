import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBoxDto } from "./dto/create-box.dto";
import { UpdateBoxDto } from "./dto/update-box.dto";

// Define interfaces to avoid 'any' type warnings
interface Box {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  price: number;
  imageUrl: string;
  backgroundImage: string;
  isActive: boolean;
  order: number;
  boxCategoryId: string;
  purchasedCount: number;
  totalRevenue: number;
  totalPayout: number;
  exchangeablePayout: number;
  retainedProfitPercentage: number;
  createdAt: Date;
  updatedAt: Date;
  items?: Item[];
}

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.box.create({
      data: {
        ...data,
        price: data.price,
      },
    }) as Promise<Box>;
  }

  findAll(): Promise<Box[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.box.findMany({
      orderBy: { order: "asc" },
      include: {
        category: true,
        items: true,
        _count: {
          select: { items: true },
        },
      },
    }) as Promise<Box[]>;
  }

  findOne(id: string): Promise<Box | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.box.findUnique({
      where: { id },
      include: { category: true, items: true },
    }) as Promise<Box | null>;
  }

  update(id: string, data: UpdateBoxDto): Promise<Box> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.box.update({
      where: { id },
      data: {
        ...data,
        price: data.price,
      },
    }) as Promise<Box>;
  }

  remove(id: string): Promise<Box> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.box.delete({ where: { id } }) as Promise<Box>;
  }

  async spinBox(boxId: string): Promise<SpinResult> {
    // 1. Fetch box with items
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const box = (await this.prisma.box.findUnique({
      where: { id: boxId },
      include: { items: true },
    })) as Box | null;

    if (!box || !box.items || box.items.length === 0) {
      throw new Error("Box not found or has no items");
    }

    // 2. Build cumulative distribution
    let cumulative = 0;
    const distribution = box.items.map((item: Item) => {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.prisma.$transaction([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.prisma.item.update({
        where: { id: selected.id },
        data: {
          purchasedCount: { increment: 1 },
        },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
