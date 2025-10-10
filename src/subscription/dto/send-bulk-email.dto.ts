import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SendBulkEmailDto {
  @ApiProperty({
    example: "🎉 Welcome!",
    description: "Subject of the email",
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: "<h1>Hello</h1><p>Thanks for subscribing!</p>",
    description: "HTML content for the email body",
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
