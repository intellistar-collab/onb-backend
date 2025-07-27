import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateBoxCategoryDto {
  @ApiProperty({
    example: "Sport Boxes",
    description: "The name of the category",
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: "A collection of sport-related mystery boxes.",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "https://example.com/sport-category.jpg",
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: "Ordering position for frontend display",
  })
  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;
}
