import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsEmail,
  IsEnum,
  Length,
  IsString,
  Matches,
  IsDate,
  IsBoolean,
} from "class-validator";
import { Role } from "../../auth/role.enum";

export class UpdateUserDto {
  @ApiProperty({ example: "newemail@example.com", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "new_username", required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @ApiProperty({ example: "newpassword123", required: false })
  @IsOptional()
  @IsString()
  @Length(6, 20, { message: "Password should be between 6 and 20 characters" })
  password?: string;

  @ApiProperty({ example: "new_firstName", required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  firstName?: string;

  @ApiProperty({ example: "new_firstName", required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  lastName?: string;

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

  @ApiProperty({ example: Role.ADMIN, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    example: "ACTIVE",
    enum: ["PENDING", "ACTIVE", "DISABLED"],
    description: "User status",
    required: false,
  })
  @IsOptional()
  @IsEnum({ PENDING: "PENDING", ACTIVE: "ACTIVE", DISABLED: "DISABLED" })
  status?: "PENDING" | "ACTIVE" | "DISABLED";

  @ApiProperty({
    example: "123456",
    required: false,
    description: "6-digit OTP for verification",
  })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: "OTP must be a 6-digit number" })
  otp?: string | null;

  @ApiProperty({
    example: "2025-03-25T14:30:00.000Z",
    required: false,
    description: "OTP expiration timestamp",
  })
  @IsOptional()
  @IsDate()
  otpExpiry?: Date | null;

  @ApiProperty({
    example: "some-generated-token",
    required: false,
    description: "Password reset token",
  })
  @IsOptional()
  @IsString()
  resetToken?: string | null;

  @ApiProperty({
    example: "2025-03-25T14:30:00.000Z",
    required: false,
    description: "Password reset token expiration timestamp",
  })
  @IsOptional()
  @IsDate()
  resetTokenExpiry?: Date | null;

  @ApiProperty({
    example: "randomly-generated-refresh-token",
    required: false,
    description: "Refresh token (usually auto-generated)",
  })
  @IsOptional()
  @IsString()
  refreshToken?: string | null;

  @ApiProperty({
    example: "2025-04-01T14:30:00.000Z",
    required: false,
    description: "Refresh token expiration timestamp",
  })
  @IsOptional()
  @IsDate()
  refreshTokenExpiry?: Date | null;

  @ApiProperty({
    example: true,
    required: false,
    description: "Indicates if the user requires OTP for first login",
  })
  @IsOptional()
  @IsBoolean()
  requiresOTP?: boolean;

  @IsOptional()
  @IsDate()
  @ApiProperty({ example: "1990-01-01T00:00:00.000Z", required: false })
  dob?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Male", required: false })
  gender?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "123A", required: false })
  streetNumberOrName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Main Street", required: false })
  street?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "New York", required: false })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "NY", required: false })
  state?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "10001", required: false })
  zipCode?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "USA", required: false })
  country?: string;
}
