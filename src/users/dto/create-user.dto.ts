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
  @Length(10, 15, {
    message: "Mobile number must be between 10 and 15 characters",
  })
  mobile?: string;

  @ApiProperty({ example: "New Location", required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: "1990-01-01", required: false })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiProperty({
    example: "male",
    enum: ["male", "female", "other"],
    required: false,
    default: "male",
  })
  @IsOptional()
  @IsEnum(
    { male: "male", female: "female", other: "other" },
    { message: "Gender must be one of: male, female, other" },
  )
  gender?: "male" | "female" | "other";

  @ApiProperty({ example: "123 Main St", required: false })
  @IsOptional()
  @IsString()
  streetNumberOrName?: string;

  @ApiProperty({ example: "Main Street", required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: "New York", required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: "NY", required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: "10001", required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: "USA", required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Indicates if the user requires OTP for first login",
  })
  @IsOptional()
  @IsBoolean()
  requiresOTP?: boolean;
}
