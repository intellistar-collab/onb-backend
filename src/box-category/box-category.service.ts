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
    return this.prisma.boxCategory.create({ data }) as Promise<BoxCategory>;
  }

  findAll(): Promise<BoxCategory[]> {
    return this.prisma.boxCategory.findMany({
      orderBy: { order: "asc" },
      include: { boxes: true },
    }) as Promise<BoxCategory[]>;
  }

  findOne(id: string): Promise<BoxCategory | null> {
    return this.prisma.boxCategory.findUnique({
      where: { id },
      include: { boxes: true },
    }) as Promise<BoxCategory | null>;
  }

  update(id: string, data: UpdateBoxCategoryDto): Promise<BoxCategory> {
    return this.prisma.boxCategory.update({
      where: { id },
      data,
    }) as Promise<BoxCategory>;
  }

  remove(id: string): Promise<BoxCategory> {
    return this.prisma.boxCategory.delete({
      where: { id },
    }) as Promise<BoxCategory>;
  }
}
