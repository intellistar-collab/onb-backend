import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsUrl, IsNumber } from "class-validator";

// Define ItemStatus enum locally since it's not exported from @prisma/client
export enum ItemStatus {
  MOST_WANTED = "MOST_WANTED",
  WANTED = "WANTED",
  IN_DEMAND = "IN_DEMAND",
  UNCOMMON = "UNCOMMON",
  COMMON = "COMMON",
}

export class CreateItemDto {
  @ApiProperty({
    example: "Diamond Ring",
    description: "The name of the item",
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: "18k gold ring with diamonds",
    required: false,
    description: "A short description of the item",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "https://example.com/images/diamond-ring.jpg",
    required: false,
    description: "Image URL of the item",
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    example: 999.99,
    required: false,
    description: "Price of the item",
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: "MOST_WANTED",
    enum: ItemStatus,
    description: "Status of the item indicating rarity or demand",
  })
  @IsEnum(ItemStatus)
  status: ItemStatus;

  @ApiProperty({
    example: "clxyz12345abcde",
    description: "ID of the box this item belongs to (required)",
  })
  @IsString()
  boxId: string; // Required, ensuring item belongs to exactly one box

  @ApiProperty({
    example: 10,
    required: false,
    default: 0,
    description: "Percentage chance for the item in the box (0 if unused)",
  })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: "Analytics: number of views for this item",
  })
  @IsOptional()
  @IsNumber()
  viewCount?: number;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: "Analytics: number of clicks for this item",
  })
  @IsOptional()
  @IsNumber()
  clickCount?: number;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: "Analytics: number of times the item was opened",
  })
  @IsOptional()
  @IsNumber()
  openedCount?: number;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: "Analytics: number of times the item was purchased",
  })
  @IsOptional()
  @IsNumber()
  purchasedCount?: number;
}
