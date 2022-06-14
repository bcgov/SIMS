import { IntersectionType } from "@nestjs/swagger";
import { IsNotEmptyObject } from "class-validator";
import { ActiveApplicationDataAPIOutDTO } from "../../../route-controllers/institution-locations/models/application.dto";

export class ScholasticStandingDataAPIInDTO {
  dateOfChange?: string;
  booksAndSupplies?: number;
  dateOfCompletion?: string;
  exceptionalCosts?: number;
  mandatoryFees?: number;
  tuition?: number;
  numberOfUnsuccessfulWeeks?: number;
  dateOfWithdrawal?: string;
  scholasticStanding: string;
}

// This DTO must/will be validated using the dryRun.
export class ScholasticStandingAPIInDTO {
  @IsNotEmptyObject()
  data: ScholasticStandingDataAPIInDTO;
}

export class ScholasticStandingSubmittedDetailsAPIOutDTO extends IntersectionType(
  ScholasticStandingDataAPIInDTO,
  ActiveApplicationDataAPIOutDTO,
) {}
