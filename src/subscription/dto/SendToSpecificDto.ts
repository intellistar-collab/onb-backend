import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendToSpecificDto {
  @ApiProperty({
    example: ['user1@example.com', 'user2@example.com'],
    description: 'List of emails to send the message to',
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];

  @ApiProperty({
    example: '📢 New Announcement!',
    description: 'Subject of the email',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: '<h1>Update</h1><p>We have some great news!</p>',
    description: 'HTML content for the email body',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
