import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBoxCategoryDto } from "./dto/create-box-category.dto";
import { UpdateBoxCategoryDto } from "./dto/update-box-category.dto";

@Injectable()
export class BoxCategoryService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBoxCategoryDto) {
    return this.prisma.boxCategory.create({ data });
  }

  findAll() {
    return this.prisma.boxCategory.findMany({
      orderBy: { order: "asc" },
      include: { boxes: true },
    });
  }

  findOne(id: string) {
    return this.prisma.boxCategory.findUnique({
      where: { id },
      include: { boxes: true },
    });
  }

  update(id: string, data: UpdateBoxCategoryDto) {
    return this.prisma.boxCategory.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.boxCategory.delete({ where: { id } });
  }
}
