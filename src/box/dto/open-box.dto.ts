import { IsString, IsNotEmpty } from "class-validator";

export class OpenBoxDto {
  @IsString()
  @IsNotEmpty()
  boxId: string;
}
