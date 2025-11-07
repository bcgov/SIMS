import { OfferingIntensity } from "@sims/sims-db";
import { OptionItemAPIOutDTO } from "../../models/common.dto";

export class ProgramYearApiOutDTO extends OptionItemAPIOutDTO {
  offeringIntensity: OfferingIntensity[];
}
