import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum InventoryStatus {
  KEPT = 'KEPT',
  SOLD = 'SOLD',
}

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  boxId: string;

  @IsEnum(InventoryStatus)
  status: InventoryStatus;
}
