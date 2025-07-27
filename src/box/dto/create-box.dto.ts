import { ApiProperty } from "@nestjs/swagger";
import {
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
} from "class-validator";

export class CreateBoxDto {
  @ApiProperty({
    example: "Football Box",
    description: "The title of the box",
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: "Includes a football, jersey, and other sport accessories.",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "Dubai",
    description: "The location of the box",
  })
  @IsString()
  location: string;

  @ApiProperty({
    example: "149.99",
    description: "The price of the box as a string to support Prisma.Decimal",
  })
  @IsString()
  price: string;

  @ApiProperty({
    example: "https://example.com/football-box.jpg",
    description: "Image URL for the box",
  })
  @IsString()
  imageUrl: string;

  @ApiProperty({
    example: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0))",
    description: "CSS background image or gradient",
  })
  @IsString()
  backgroundImage: string;

  @ApiProperty({
    example: "clb1n7r3d0000lhf8w1xz0h2d",
    description: "ID of the BoxCategory this box belongs to",
  })
  @IsString()
  boxCategoryId: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Whether the box is active",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 1,
    required: false,
    description: "Ordering position for frontend display",
  })
  @IsOptional()
  @IsInt()
  order?: number;
}
