import { OptionItemAPIOutDTO } from "@/services/http/dto/Common.dto";
import { OfferingIntensity } from "@/types";

export interface ProgramYearApiOutDTO extends OptionItemAPIOutDTO {
  offeringIntensity: OfferingIntensity[];
}
