import { IntersectionType } from "@nestjs/swagger";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { IsNotEmptyObject } from "class-validator";
import { ActiveApplicationDataAPIOutDTO } from "../../../route-controllers/institution-locations/models/application.dto";

const JSON_10KB = 10240;

/**
 * The API will also allow other property that are not added below.
 */
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
  @JsonMaxSize(JSON_10KB)
  data: ScholasticStandingDataAPIInDTO;
}

export class ScholasticStandingSubmittedDetailsAPIOutDTO extends IntersectionType(
  ScholasticStandingDataAPIInDTO,
  ActiveApplicationDataAPIOutDTO,
) {}
