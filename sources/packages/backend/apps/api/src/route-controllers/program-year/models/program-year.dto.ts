import { OfferingIntensity } from "@sims/sims-db";
import { OptionItemAPIOutDTO } from "apps/api/src/route-controllers/models/common.dto";

export class ProgramYearApiOutDTO extends OptionItemAPIOutDTO {
  offeringIntensity: OfferingIntensity[];
}
