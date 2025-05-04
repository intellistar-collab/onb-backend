import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreatePasswordResetDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;
}
