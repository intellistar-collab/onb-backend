import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, Matches } from "class-validator";

export class OtpDto {
  @ApiProperty({ example: "user@gmail.com", description: "User email" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "123456",
    description: "OTP code received via email",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "OTP must be a 6-digit number" })
  otp: string;
}
