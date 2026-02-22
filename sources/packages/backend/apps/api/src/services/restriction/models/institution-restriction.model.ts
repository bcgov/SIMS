import { FieldRequirementType } from "@sims/sims-db";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsNotEmptyObject,
  IsPositive,
} from "class-validator";
/**
 * Maximum allowed locations while assigning institution restriction.
 * Added a non-real-world limit to avoid leaving the API open to
 * receive a very large payloads.
 */
const MAX_ALLOWED_LOCATIONS = 100;
export class InstitutionRestrictionValidationModel {
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ALLOWED_LOCATIONS)
  @IsPositive({ each: true })
  locationIds: number[];

  @IsPositive()
  programId: number;

  @IsNotEmptyObject()
  fieldRequirements: Record<string, FieldRequirementType>;
}

export interface CreateInstitutionRestrictionModel {
  restrictionId: number;
  noteDescription: string;
  locationIds?: number[];
  programId?: number;
}
