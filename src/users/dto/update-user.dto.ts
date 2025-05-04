import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEmail,
  IsEnum,
  Length,
  IsString,
  Matches,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../auth/role.enum';

export class UpdateUserDto {
  @ApiProperty({ example: 'newemail@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'new_username', required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @ApiProperty({ example: 'New Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'New Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Length(10, 15)
  mobile?: string;

  @ApiProperty({ example: 'New Location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: Role.ADMIN, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: '123456', required: false, description: '6-digit OTP for verification' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp?: string | null;

  @ApiProperty({
    example: '2025-03-25T14:30:00.000Z',
    required: false,
    description: 'OTP expiration timestamp',
  })
  @IsOptional()
  @IsDate()
  otpExpiry?: Date | null;

  @ApiProperty({
    example: 'some-generated-token',
    required: false,
    description: 'Password reset token',
  })
  @IsOptional()
  @IsString()
  resetToken?: string | null;

  @ApiProperty({
    example: '2025-03-25T14:30:00.000Z',
    required: false,
    description: 'Password reset token expiration timestamp',
  })
  @IsOptional()
  @IsDate()
  resetTokenExpiry?: Date | null;

  @ApiProperty({
    example: 'randomly-generated-refresh-token',
    required: false,
    description: 'Refresh token (usually auto-generated)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string | null;

  @ApiProperty({
    example: '2025-04-01T14:30:00.000Z',
    required: false,
    description: 'Refresh token expiration timestamp',
  })
  @IsOptional()
  @IsDate()
  refreshTokenExpiry?: Date | null;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Indicates if the user requires OTP for first login',
  })
  @IsOptional()
  @IsBoolean()
  requiresOTP?: boolean;
}
