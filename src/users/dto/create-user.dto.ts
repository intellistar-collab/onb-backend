import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "Ayman", description: "User Name" })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "John", description: "First Name", required: false })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @ApiProperty({ example: "Doe", description: "Last Name", required: false })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @ApiProperty({ example: "user@gmail.com", description: "User email" })
  @IsEmail({}, { message: "Invalid email address" })
  email: string;

  @ApiProperty({ example: "password123", description: "User password" })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20, { message: "Password should be between 6 and 20 characters" })
  password: string;

  @ApiProperty({
    example: "ADMIN",
    enum: ["ADMIN", "USER", "SUPER_ADMIN"],
    description: "User role",
  })
  @IsEnum({ ADMIN: "ADMIN", USER: "USER", SUPER_ADMIN: "SUPER_ADMIN" })
  role: "ADMIN" | "USER" | "SUPER_ADMIN";

  @ApiProperty({
    example: "PENDING",
    enum: ["PENDING", "ACTIVE", "DISABLED"],
    description: "User status",
    required: false,
  })
  @IsOptional()
  @IsEnum({ PENDING: "PENDING", ACTIVE: "ACTIVE", DISABLED: "DISABLED" })
  status?: "PENDING" | "ACTIVE" | "DISABLED";

  @ApiProperty({ example: "New Avatar URL", required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: "New Address", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: "+1234567890", required: false })
  @IsOptional()
  @IsString()
  @Length(10, 15)
  mobile?: string;

  @ApiProperty({ example: "New Location", required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Indicates if the user requires OTP for first login",
  })
  @IsOptional()
  @IsBoolean()
  requiresOTP?: boolean;
}
