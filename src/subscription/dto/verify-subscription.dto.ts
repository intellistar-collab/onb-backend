import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifySubscriptionDto {
  @ApiProperty({ example: "1b2c3d4e..." })
  @IsNotEmpty()
  @IsString()
  token: string;
}
