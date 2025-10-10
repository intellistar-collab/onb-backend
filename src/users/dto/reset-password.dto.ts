import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Length } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: "newPassword123", description: "New password" })
  @IsString()
  @Length(6, 20, { message: "Password should be between 6 and 20 characters" })
  password: string;

  @ApiProperty({
    example: "resetToken",
    description: "Password reset token from URL",
  })
  @IsString()
  @IsNotEmpty()
  resetToken: string;
}
