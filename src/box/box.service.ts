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
      include: { category: true, items: true },
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
}
