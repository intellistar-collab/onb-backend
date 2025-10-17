import { IsEnum, IsOptional } from 'class-validator';
import { InventoryStatus } from './create-inventory-item.dto';

export class UpdateInventoryItemDto {
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;
}
