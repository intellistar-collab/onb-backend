import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ description: "Current password" })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: "New password (minimum 6 characters)" })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  newPassword: string;
}
