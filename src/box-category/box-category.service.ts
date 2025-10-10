import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBoxCategoryDto } from "./dto/create-box-category.dto";
import { UpdateBoxCategoryDto } from "./dto/update-box-category.dto";

// Define BoxCategory interface to avoid 'any' type warnings
interface BoxCategory {
  id: string;
  name: string;
  description?: string | null;
  photo?: string | null;
  order: number;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
  boxes?: any[]; // Include boxes relation
}

@Injectable()
export class BoxCategoryService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBoxCategoryDto): Promise<BoxCategory> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.boxCategory.create({ data }) as Promise<BoxCategory>;
  }

  findAll(): Promise<BoxCategory[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.boxCategory.findMany({
      orderBy: { order: "asc" },
      include: { boxes: true },
    }) as Promise<BoxCategory[]>;
  }

  findOne(id: string): Promise<BoxCategory | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.boxCategory.findUnique({
      where: { id },
      include: { boxes: true },
    }) as Promise<BoxCategory | null>;
  }

  update(id: string, data: UpdateBoxCategoryDto): Promise<BoxCategory> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.boxCategory.update({
      where: { id },
      data,
    }) as Promise<BoxCategory>;
  }

  remove(id: string): Promise<BoxCategory> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.prisma.boxCategory.delete({
      where: { id },
    }) as Promise<BoxCategory>;
  }
}
