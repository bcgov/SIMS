import { OfferingIntensity } from "@sims/sims-db";
import { IsEnum, IsOptional, IsPositive } from "class-validator";

export class DynamicFormConfigurationAPIOutDTO {
  formDefinitionName: string;
}

export class DynamicFormConfigurationAPIInDTO {
  @IsOptional()
  @IsPositive()
  programYearId?: number;
  @IsOptional()
  @IsEnum(OfferingIntensity)
  offeringIntensity?: OfferingIntensity;
}
