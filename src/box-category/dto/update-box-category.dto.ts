import { PartialType } from "@nestjs/mapped-types";
import { CreateBoxCategoryDto } from "./create-box-category.dto";

export class UpdateBoxCategoryDto extends PartialType(CreateBoxCategoryDto) {}
