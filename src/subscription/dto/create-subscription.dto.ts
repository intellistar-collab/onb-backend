import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'referrer@example.com', required: false })
  @IsEmail()
  @IsOptional()
  referrerEmail?: string;
}
