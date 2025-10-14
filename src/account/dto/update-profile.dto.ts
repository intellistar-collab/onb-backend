import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEmail } from "class-validator";

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: "User's first name" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, description: "User's last name" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, description: "User's username" })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, description: "User's email address" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: "User's mobile number" })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ required: false, description: "User's date of birth" })
  @IsOptional()
  dob?: string | null;

  @ApiProperty({ required: false, description: "User's gender" })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false, description: "User's avatar URL" })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, description: "User's full address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: "User's street number or name" })
  @IsOptional()
  @IsString()
  streetNumberOrName?: string;

  @ApiProperty({ required: false, description: "User's street name" })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ required: false, description: "User's city" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: "User's state or province" })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false, description: "User's ZIP or postal code" })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ required: false, description: "User's country" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, description: "User's general location" })
  @IsOptional()
  @IsString()
  location?: string;
}
